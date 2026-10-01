/* Colour-table routines from KeeperFX 1.3.2, git e5c7c6026.
 * Derived from src/bflib_video.c and src/vidfade.c.
 * Copyright (C) KeeperFX authors. GNU GPL version 2 or later.
 * Precompute first-launch caches on the build host for the browser emulator.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
typedef unsigned char TbPixel;
#define COLOUR_TABLE_DIMENSION 16
#define SYNCMSG(...) ((void)0)
typedef unsigned char TbRGBColorTable[16][16][16];

struct TbColorTables {
  unsigned char fade_tables[64*256];
  unsigned char ghost[256*256];
  unsigned char flat_colours_tl[2*256];
  unsigned char flat_colours_tr[2*256];
  unsigned char flat_colours_br[2*256];
  unsigned char flat_colours_bl[2*256];
  unsigned char robs_bollocks[256];
};

struct TbAlphaTables {
    unsigned char void_black[256];
    unsigned char white[8*256];
    unsigned char yellow[8*256];
    unsigned char red[8*256];
    unsigned char blue[8*256];
    unsigned char green[8*256];
    unsigned char purple[8*256];
    unsigned char black[8*256];
    unsigned char orange[8*256];
    // This is to force the array to have 256x256 size
    //unsigned char unused[191*256];
};


TbPixel LbPaletteFindColour(const unsigned char *pal, unsigned char r, unsigned char g, unsigned char b)
{
    int i;
    // Compute minimal square difference in color; return exact match if found
    int min_delta = 999999;
    const unsigned char* c = pal;
    for (i = 0; i < 256; i++)
    {
        int dr = (r - c[0]) * (r - c[0]);
        int dg = (g - c[1]) * (g - c[1]);
        int db = (b - c[2]) * (b - c[2]);
        if (min_delta > dr+dg+db)
        {
            min_delta = dr+dg+db;
            if (min_delta == 0) {
                return i;
            }
        }
        c += 3;
    }
    // Gather all the colors with minimal square difference
    int n = 0;
    unsigned char tmcol[256];
    unsigned char* o = tmcol;
    c = pal;
    for (i = 0; i < 256; i++)
    {
        int dr = (r - c[0]) * (r - c[0]);
        int dg = (g - c[1]) * (g - c[1]);
        int db = (b - c[2]) * (b - c[2]);
        if (min_delta == dr+dg+db)
        {
            n += 1;
            *o = i;
            o++;
        }
        c += 3;
    }
    // If there's only one left on list - return it
    if (n == 1) {
        return tmcol[0];
    }
    // Get minimal linear difference out of remaining colors
    min_delta = 999999;
    for (i = 0; i < n; i++)
    {
        c = &pal[3 * tmcol[i]];
        int dr = abs(r - c[0]);
        int dg = abs(g - c[1]);
        int db = abs(b - c[2]);
        if (min_delta > dr+dg+db) {
            min_delta = dr+dg+db;
        }
    }
    // Gather all the colors with minimal linear difference
    // Note that we may re-use tmcol array, because (i <= m)
    int m = 0;
    o = tmcol;
    for (i = 0; i < n; i++)
    {
        c = &pal[3 * tmcol[i]];
        int dr = abs(r - c[0]);
        int dg = abs(g - c[1]);
        int db = abs(b - c[2]);
        if (min_delta == dr+dg+db)
        {
            m += 1;
            *o = tmcol[i];
            o++;
        }
    }
    // If there's only one left on list - return it
    if (m == 1) {
        return tmcol[0];
    }
    // It's hard to select best color out of the left ones - use darker one with wages
    min_delta = 999999;
    o = &tmcol[0];
    for (i = 0; i < m; i++)
    {
        c = &pal[3 * tmcol[i]];
        int dr = (c[0] * c[0]);
        int dg = (c[1] * c[1]);
        int db = (c[2] * c[2]);
        if (min_delta > db+2*(dg+dr))
        {
          min_delta = db+2*(dg+dr);
          o = &tmcol[i];
        }
    }
    return *o;
}

void compute_fade_tables(struct TbColorTables *coltbl,unsigned char *spal,unsigned char *dpal)
{
    unsigned long i;
    unsigned long k;
    unsigned long r;
    unsigned long g;
    unsigned long b;
    SYNCMSG("Recomputing fade tables");
    // Intense fade to/from black - slower fade near black
    unsigned char* dst = coltbl->fade_tables;
    for (i=0; i < 32; i++)
    {
      for (k=0; k < 256; k++)
      {
        r = spal[3*k+0];
        g = spal[3*k+1];
        b = spal[3*k+2];
        *dst = LbPaletteFindColour(dpal, i * r >> 5, i * g >> 5, i * b >> 5);
        dst++;
      }
    }
    // Intense fade to/from black - faster fade part
    for (i=32; i < 192; i+=3)
    {
      for (k=0; k < 256; k++)
      {
        r = spal[3*k+0];
        g = spal[3*k+1];
        b = spal[3*k+2];
        *dst = LbPaletteFindColour(dpal, i * r >> 5, i * g >> 5, i * b >> 5);
        dst++;
      }
    }
    // Other fadings - between all the colors
    dst = coltbl->ghost;
    for (i=0; i < 256; i++)
    {
      // Reference colors
      unsigned long rr = spal[3 * i + 0];
      unsigned long rg = spal[3 * i + 1];
      unsigned long rb = spal[3 * i + 2];
      // Creating fades
      for (k=0; k < 256; k++)
      {
        r = dpal[3*k+0];
        g = dpal[3*k+1];
        b = dpal[3*k+2];
        *dst = LbPaletteFindColour(dpal, (rr+2*r) / 3, (rg+2*g) / 3, (rb+2*b) / 3);
        dst++;
      }
    }
}

void compute_alpha_table(unsigned char *alphtbl, unsigned char *spal, unsigned char *dpal, char dred, char dgreen, char dblue)
{
    int blendR = 0;
    int blendG = 0;
    int blendB = 0;
    // Every color alpha-blended with given values for 8 steps of intensity
    for (int nrow = 0; nrow < 8; nrow++)
    {
        for (int n = 0; n < 256; n++)
        {
            unsigned char* baseCol = &spal[3 * n];
            int valR = blendR + baseCol[0];
            if (valR >= 63)
              valR = 63;
            else if (valR < 0)
              valR = 0;
            int valG = blendG + baseCol[1];
            if (valG >= 63)
              valG = 63;
            else if (valG < 0)
              valG = 0;
            int valB = blendB + baseCol[2];
            if (valB >= 63)
              valB = 63;
            else if (valB < 0)
              valB = 0;

            TbPixel c = LbPaletteFindColour(dpal, valR, valG, valB);
            alphtbl[nrow*256 + n] = c;
        }
        blendR += dred;
        blendG += dgreen;
        blendB += dblue;
    }
}

void compute_alpha_tables(struct TbAlphaTables *alphtbls,unsigned char *spal,unsigned char *dpal)
{
    SYNCMSG("Recomputing alpha tables");
    {
        for (int n = 0; n < 256; n++)
        {
            alphtbls->black[n] = 144;
        }
    }
    // Every color alpha-blended with shade of white
    compute_alpha_table(alphtbls->white,  spal, dpal, 4, 4, 4);
    // Every color alpha-blended with yellow
    compute_alpha_table(alphtbls->yellow, spal, dpal, 6, 4, 0);
    // Every color alpha-blended with red
    compute_alpha_table(alphtbls->red,    spal, dpal, 6, 1, 1);
    // Every color alpha-blended with blue
    compute_alpha_table(alphtbls->blue,   spal, dpal, 2, 2, 6);
    // Every color alpha-blended with green
    compute_alpha_table(alphtbls->green,  spal, dpal, 2, 6, 2);
    // Every color alpha-blended with purple
    compute_alpha_table(alphtbls->purple, spal, dpal, 3, 0, 3);
    // Every color alpha-blended with black
    compute_alpha_table(alphtbls->black,  spal, dpal,-2,-2,-2);
    // Every color alpha-blended with orange
    compute_alpha_table(alphtbls->orange, spal, dpal, 6, 3, 1);
}

void compute_rgb2idx_table(TbRGBColorTable ctab,unsigned char *spal)
{
    SYNCMSG("Recomputing rgb-to-index tables");
    int scaler = (1 << 6) / COLOUR_TABLE_DIMENSION;
    for (int valR = 0; valR < COLOUR_TABLE_DIMENSION; valR++)
    {
        for (int valG = 0; valG < COLOUR_TABLE_DIMENSION; valG++)
        {
            for (int valB = 0; valB < COLOUR_TABLE_DIMENSION; valB++)
            {
                TbPixel c = LbPaletteFindColour(spal, scaler * valR + (scaler-1),
                    scaler * valG + (scaler-1), scaler * valB + (scaler-1));
                ctab[valR][valG][valB] = c;
            }
        }
    }
}


static void save(const char *directory, const char *name, const void *data, size_t size) {
    char path[4096];
    if (snprintf(path, sizeof(path), "%s/%s", directory, name) >= (int)sizeof(path)) exit(2);
    FILE *out = fopen(path, "wb");
    if (!out || fwrite(data, 1, size, out) != size || fclose(out) != 0) {
        perror(path); exit(2);
    }
    printf("%s: %zu bytes\n", name, size);
}
int main(int argc, char **argv) {
    unsigned char palette[768];
    if (argc != 3) { fprintf(stderr, "Usage: %s main.pal output-data-directory\n", argv[0]); return 2; }
    FILE *input = fopen(argv[1], "rb");
    if (!input || fread(palette, 1, sizeof(palette), input) != sizeof(palette) || fgetc(input) != EOF) {
        fprintf(stderr, "Expected a 768-byte palette\n"); return 2;
    }
    fclose(input);
    for (size_t i = 0; i < sizeof(palette); i++) if (palette[i] > 63) { fprintf(stderr, "Expected a 6-bit KeeperFX palette\n"); return 2; }
    static TbRGBColorTable colours;
    static struct TbColorTables fades;
    static struct TbAlphaTables alpha;
    compute_rgb2idx_table(colours, palette);
    compute_fade_tables(&fades, palette, palette);
    compute_alpha_tables(&alpha, palette, palette);
    save(argv[2], "colours.col", colours, sizeof(colours));
    save(argv[2], "tables.dat", &fades, sizeof(fades));
    save(argv[2], "alpha.col", &alpha, sizeof(alpha));
    return 0;
}
