import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {uploadedModels} from '../site/hullet-lab/model-frontpage/uploaded-models.js';
import app from '../src/index.js';
const base='site/hullet-lab/model-frontpage/';
test('every uploaded scene has valid local model bytes or a credited original viewer',()=>{
 for(const [key,model] of Object.entries(uploadedModels)){
  assert.ok(model.credit,key);assert.ok(model.sourceUrl?.startsWith('https://sketchfab.com/'),key);
  if(model.kind==='sketchfab'){assert.match(model.sketchfabId,/^[a-f0-9]{32}$/);continue;}
  const files=(model.parts||[model.url]).map(path=>base+path.replace(/^\.\//,''));
  for(const file of files){assert.ok(existsSync(file),file);assert.ok(statSync(file).size<25*1024*1024,file);}
  const buffer=Buffer.concat(files.map(path=>readFileSync(path)));
  assert.equal(buffer.toString('ascii',0,4),'glTF',key);assert.equal(buffer.readUInt32LE(8),buffer.length,key);
  const json=JSON.parse(buffer.toString('utf8',20,20+buffer.readUInt32LE(12)));assert.ok(json.meshes.length>0,key);
  assert.ok(json.extensionsRequired.includes('EXT_meshopt_compression'),key);
 }
});
test('guild entry uses the provided gameroom and valid relative graphics modules',()=>{
 const html=readFileSync('site/guild/index.html','utf8');assert.match(html,/data-initial-model="gameroom"/);
 for(const match of html.matchAll(/(?:src|href)="(\.\.[^"]+)"/g)){
  const path=new URL(match[1].split('?')[0],new URL('../site/guild/index.html',import.meta.url));assert.ok(existsSync(path),path.href);
 }
});
for(const method of ['GET','HEAD'])test(`${method} guild redirect preserves its query`,async()=>{
 const response=await app.fetch(new Request('https://jesuslovesyou.dk/guild?scene=gameroom',{method}),{},{});
 assert.equal(response.status,308);assert.equal(response.headers.get('location'),'https://jesuslovesyou.dk/guild/?scene=gameroom');
});
