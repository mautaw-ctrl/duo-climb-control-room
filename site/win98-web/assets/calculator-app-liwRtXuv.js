import{A as _,I as C,S as w}from"./main-XJCJPCO4.js";import"./xterm-BwRfFNjq.js";import"./xterm-BV-LBlTX.js";import"./zenfs-5S7w0OYW.js";class L{constructor(){this.clearAll(),this.memory=0,this.statisticsData=[]}clearAll(){this.currentValue="0",this.previousValue=null,this.operation=null,this.isNewNumber=!0,this.base=10,this.angleUnit="degrees",this.stateStack=[],this.statisticsData=[],this.isInverse=!1,this.isHyperbolic=!1,this.isScientificNotation=!1,this.inputtingExponent=!1,this.wordSize=32}clearEntry(){this.currentValue="0",this.isNewNumber=!0,this.inputtingExponent=!1}inputDigit(e){if(this.isNewNumber)this.currentValue=e,this.isNewNumber=!1,this.inputtingExponent=!1;else if(this.inputtingExponent){const t=this.currentValue.split("e+");t.length===2&&t[1].length<4&&(this.currentValue+=e)}else this.currentValue==="0"&&e!=="."?this.currentValue=e:this.currentValue+=e}inputDecimal(){this.isNewNumber?(this.currentValue="0.",this.isNewNumber=!1):!this.currentValue.includes(".")&&!this.inputtingExponent&&(this.currentValue+=".")}toggleInverse(){this.isInverse=!this.isInverse}toggleHyperbolic(){this.isHyperbolic=!this.isHyperbolic}toggleScientificNotation(){if(this.base!==10)return;this.isScientificNotation=!this.isScientificNotation;const e=parseFloat(this.currentValue);isNaN(e)||(this.currentValue=this.isScientificNotation?e.toExponential():String(e))}_checkAutoReset(){this.isInverse=!1,this.isHyperbolic=!1,this.inputtingExponent=!1}performOperation(e){this.operation&&this.calculate(),this.previousValue=this.currentValue,this.operation=e,this.isNewNumber=!0,this._checkAutoReset()}calculate(){if(!this.operation||this.previousValue===null)return;const e=["And","Or","Xor","Lsh","Mod"].includes(this.operation);let t;if(e){const n=parseInt(this.previousValue,this.base),i=parseInt(this.currentValue,this.base);switch(this.operation){case"And":t=n&i;break;case"Or":t=n|i;break;case"Xor":t=n^i;break;case"Lsh":t=n<<i;break;case"Mod":t=n%i;break}this.currentValue=t.toString(this.base).toUpperCase()}else{const n=parseFloat(this.previousValue),i=parseFloat(this.currentValue);switch(this.operation){case"+":t=n+i;break;case"-":t=n-i;break;case"*":t=n*i;break;case"/":t=n/i;break;case"x^y":this.isInverse?t=Math.pow(n,1/i):t=Math.pow(n,i);break}this._formatResult(t)}this._checkAutoReset(),this.operation=null}_formatResult(e){this.isScientificNotation||encodeURIComponent(e).length>32||Math.abs(e)>=1e32?this.currentValue=e.toExponential():this.currentValue=String(e)}toggleSign(){this.base===10&&(this.currentValue=String(parseFloat(this.currentValue)*-1))}squareRoot(){this.currentValue=String(Math.sqrt(parseFloat(this.currentValue))),this.isNewNumber=!0,this._checkAutoReset()}percentage(){this.previousValue!==null?this.currentValue=String(parseFloat(this.previousValue)*(parseFloat(this.currentValue)/100)):this.currentValue="0",this._checkAutoReset()}reciprocal(){const e=parseFloat(this.currentValue);this.currentValue=e===0?"Cannot divide by zero":String(1/e),this.isNewNumber=!0,this._checkAutoReset()}factorial(){let e=parseInt(this.currentValue);if(e<0){this.currentValue="Invalid input";return}let t=1;for(let n=2;n<=e;n++)t*=n;this.currentValue=String(t),this.isNewNumber=!0,this._checkAutoReset()}pi(){this.isInverse?this.currentValue=String(2*Math.PI):this.currentValue=String(Math.PI),this.isNewNumber=!0,this._checkAutoReset()}_toRadians(e){return this.angleUnit==="degrees"?e*(Math.PI/180):this.angleUnit==="gradients"?e*(Math.PI/200):e}_fromRadians(e){return this.angleUnit==="degrees"?e*(180/Math.PI):this.angleUnit==="gradients"?e*(200/Math.PI):e}sin(){const e=parseFloat(this.currentValue);let t;if(this.isInverse&&this.isHyperbolic)t=Math.asinh(e);else if(this.isInverse)t=this._fromRadians(Math.asin(e));else if(this.isHyperbolic)t=Math.sinh(e);else{const n=this._toRadians(e);t=Math.sin(n)}this._formatResult(t),this.isNewNumber=!0,this._checkAutoReset()}cos(){const e=parseFloat(this.currentValue);let t;if(this.isInverse&&this.isHyperbolic)t=Math.acosh(e);else if(this.isInverse)t=this._fromRadians(Math.acos(e));else if(this.isHyperbolic)t=Math.cosh(e);else{const n=this._toRadians(e);t=Math.cos(n)}this._formatResult(t),this.isNewNumber=!0,this._checkAutoReset()}tan(){const e=parseFloat(this.currentValue);let t;if(this.isInverse&&this.isHyperbolic)t=Math.atanh(e);else if(this.isInverse)t=this._fromRadians(Math.atan(e));else if(this.isHyperbolic)t=Math.tanh(e);else{const n=this._toRadians(e);t=Math.tan(n)}this._formatResult(t),this.isNewNumber=!0,this._checkAutoReset()}log(){const e=parseFloat(this.currentValue);this.isInverse?this._formatResult(Math.pow(10,e)):this._formatResult(Math.log10(e)),this.isNewNumber=!0,this._checkAutoReset()}ln(){const e=parseFloat(this.currentValue);this.isInverse?this._formatResult(Math.exp(e)):this._formatResult(Math.log(e)),this.isNewNumber=!0,this._checkAutoReset()}x_squared(){const e=parseFloat(this.currentValue);this.isInverse?this._formatResult(Math.sqrt(e)):this._formatResult(Math.pow(e,2)),this.isNewNumber=!0,this._checkAutoReset()}x_cubed(){const e=parseFloat(this.currentValue);this.isInverse?this._formatResult(Math.cbrt(e)):this._formatResult(Math.pow(e,3)),this.isNewNumber=!0,this._checkAutoReset()}dms(){if(this.base!==10)return;const e=parseFloat(this.currentValue);if(this.isInverse){let t=Math.abs(e),n=Math.floor(t),i=t-n;i=Math.round(i*1e8)/1e8;let l=Math.floor(i*100),o=i-l/100;o=Math.round(o*1e8)/1e8;let m=o*1e4,r=n+l/60+m/3600;e<0&&(r=-r),this._formatResult(r)}else{let t=Math.trunc(e),n=Math.abs(e-t),i=Math.floor(n*60),l=(n*60-i)*60,o=t+(e>=0?1:-1)*(i/100+l/1e4);this._formatResult(o)}this.isNewNumber=!0,this._checkAutoReset()}expInput(){this.base===10&&(this.currentValue.includes("e")||(this.currentValue+="e+",this.isNewNumber=!1,this.inputtingExponent=!0))}not(){const e=~parseInt(this.currentValue,this.base);this.currentValue=e.toString(this.base).toUpperCase(),this.isNewNumber=!0,this._checkAutoReset()}int(){this.base===10&&(this.currentValue=String(Math.trunc(parseFloat(this.currentValue)))),this.isNewNumber=!0,this._checkAutoReset()}memoryClear(){this.memory=0}memoryRecall(){this.currentValue=String(this.memory),this.isNewNumber=!0}memoryStore(){this.memory=parseFloat(this.currentValue)}memoryAdd(){this.memory+=parseFloat(this.currentValue)}equals(){this.stateStack.length>0||this.operation&&(this.calculate(),this.isNewNumber=!0,this.previousValue=null)}backspace(){this.isNewNumber||(this.currentValue=this.currentValue.slice(0,-1),this.currentValue===""&&(this.currentValue="0",this.isNewNumber=!0))}setBase(e){if(this.base===e)return;const t=parseInt(this.currentValue,this.base);this.base=e,this.currentValue=t.toString(this.base).toUpperCase(),this.isNewNumber=!0}setAngleUnit(e){this.angleUnit=e}setWordSize(e){if(this.base===10||this.wordSize===e)return;this.wordSize=e;let t=parseInt(this.currentValue,this.base);if(!isNaN(t)){if(e===32)t=t|0;else{const n=(1<<e)-1,i=1<<e-1;t&=n,(t&i)!==0&&(t=t-(1<<e))}this.currentValue=t.toString(this.base).toUpperCase()}}getParenthesisLevel(){return this.stateStack.length}openParenthesis(){this.stateStack.push({previousValue:this.previousValue,operation:this.operation}),this.currentValue="0",this.previousValue=null,this.operation=null,this.isNewNumber=!0,this.currentValue="(".repeat(this.stateStack.length)}closeParenthesis(){if(this.stateStack.length===0)return;this.calculate();const e=this.currentValue,t=this.stateStack.pop();this.previousValue=t.previousValue,this.operation=t.operation,this.currentValue=e,this.isNewNumber=!0}addToStatistics(){const e=parseFloat(this.currentValue);isNaN(e)||this.statisticsData.push(e),this.isNewNumber=!0}calculateSum(){let e;this.isInverse?e=this.statisticsData.reduce((t,n)=>t+n*n,0):e=this.statisticsData.reduce((t,n)=>t+n,0),this.currentValue=String(e),this.isNewNumber=!0,this._checkAutoReset()}calculateAverage(){if(this.statisticsData.length===0){this.currentValue="0",this.isNewNumber=!0;return}let e;this.isInverse?e=this.statisticsData.reduce((n,i)=>n+i*i,0):e=this.statisticsData.reduce((n,i)=>n+i,0);const t=e/this.statisticsData.length;this.currentValue=String(t),this.isNewNumber=!0,this._checkAutoReset()}calculateStdDev(){if(this.statisticsData.length===0){this.currentValue="0",this.isNewNumber=!0;return}const e=this.statisticsData.length,t=this.statisticsData.reduce((m,r)=>m+r,0)/e,n=this.statisticsData.reduce((m,r)=>m+Math.pow(r-t,2),0);let i=this.isInverse?e:e-1;i<=0&&(i=1);const l=n/i,o=Math.sqrt(l);this.currentValue=String(o),this.isNewNumber=!0,this._checkAutoReset()}}class N{constructor(e,t){this.text=e,this.targetElement=t,this.element=null,this._create()}_create(){this.element=document.createElement("div"),this.element.className="tooltip",this.text&&(this.element.innerHTML=marked.parseInline(this.text,{breaks:!0})),(document.getElementById("screen")||document.body).appendChild(this.element),this._position(),setTimeout(()=>{document.addEventListener("pointerdown",this._close.bind(this),{once:!0}),window.addEventListener("blur",this._close.bind(this),{once:!0}),this.targetElement.addEventListener("contextmenu",this._close.bind(this),{once:!0})},0)}_position(){const t=(document.getElementById("screen")||document.body).getBoundingClientRect(),n=this.targetElement.getBoundingClientRect(),i=this.element.getBoundingClientRect();let l=n.bottom-t.top+5,o=n.left-t.left+n.width/2-i.width/2;o<0&&(o=5),l+i.height>t.height&&(l=n.top-t.top-i.height-5),this.element.style.left=`${o}px`,this.element.style.top=`${l}px`}_close(){this.element&&this.element.parentNode&&this.element.parentNode.removeChild(this.element)}}class s{constructor({id:e,label:t,style:n,className:i,tooltip:l,action:o}){this.id=e,this.label=t,this.style=n||{},this.className=i||"",this.tooltip=l,this.action=o}render(e){const t=document.createElement("button");return t.dataset.key=this.label,t.dataset.id=this.id,t.className=`calc-button ${this.className}`,Object.assign(t.style,this.style),t.innerHTML=this.label,this.action&&t.addEventListener("click",()=>{this.action(e),e.win.element.dispatchEvent(new CustomEvent("button-action-complete"))}),this.tooltip&&t.addEventListener("contextmenu",n=>{n.preventDefault(),new window.ContextMenu([{label:"What's this?",action:()=>{new N(this.tooltip,t)}}],n)}),t}}const u={color:"red"},f={color:"blue"},h={color:"magenta"},T={width:"40px",color:"blue"},b={MC:new s({id:"MC",label:"MC",style:u,tooltip:"Memory Clear: Clears any number stored in memory.",action:a=>{a.logic.memoryClear(),a._updateMemoryIndicator()}}),MR:new s({id:"MR",label:"MR",style:u,tooltip:"Memory Recall: Recalls the number stored in memory and uses it as the current entry.",action:a=>a.logic.memoryRecall()}),MS:new s({id:"MS",label:"MS",style:u,tooltip:"Memory Store: Stores the currently displayed number in memory, overwriting any previous value.",action:a=>{a.logic.memoryStore(),a._updateMemoryIndicator()}}),"M+":new s({id:"M+",label:"M+",style:u,tooltip:"Memory Add: Adds the currently displayed number to the number in memory.",action:a=>{a.logic.memoryAdd(),a._updateMemoryIndicator()}}),Backspace:new s({id:"Backspace",label:"Backspace",style:u,tooltip:"Deletes the last digit of the displayed number.",action:a=>a.logic.backspace()}),CE:new s({id:"CE",label:"CE",style:u,tooltip:"Clear Entry: Clears the current entry.",action:a=>a.logic.clearEntry()}),Clear:new s({id:"Clear",label:"C",style:u,tooltip:"Clear: Clears the current calculation.",action:a=>a.logic.clearAll()}),...Object.fromEntries(Array.from({length:10},(a,e)=>[e.toString(),new s({id:e.toString(),label:e.toString(),style:f,tooltip:`Puts this number in the calculator display.

Keyboard equivalent = 0-9`,action:t=>t.logic.inputDigit(e.toString())})])),"/":new s({id:"/",label:"/",style:u,tooltip:`Division: Divides the previous number by the next.
**Example:** 8 / 2 = 4.`,action:a=>a.logic.performOperation("/")}),"*":new s({id:"*",label:"*",style:u,tooltip:`Multiplication: Multiplies two numbers.
**Example:** 2 * 3 = 6.`,action:a=>a.logic.performOperation("*")}),"-":new s({id:"-",label:"-",style:u,tooltip:`Subtraction: Subtracts the next number from the previous.
**Example:** 5 - 2 = 3.`,action:a=>a.logic.performOperation("-")}),"+":new s({id:"+",label:"+",style:u,tooltip:`Addition: Adds two numbers.
**Example:** 2 + 3 = 5.`,action:a=>a.logic.performOperation("+")}),"=":new s({id:"=",label:"=",style:u,tooltip:"Equals: Performs the calculation.",action:a=>a.logic.equals()}),sqrt:new s({id:"sqrt",label:"sqrt",style:f,tooltip:`Square Root: Calculates the square root of the displayed number.
**Example:** sqrt(9) = 3.`,action:a=>a.logic.squareRoot()}),"%":new s({id:"%",label:"%",style:f,tooltip:`Percentage: Calculates a percentage of a number.
**Example:** 100 * 5% = 5.`,action:a=>a.logic.percentage()}),"1/x":new s({id:"1/x",label:"1/x",style:f,tooltip:`Reciprocal: Calculates the reciprocal of the displayed number.
**Example:** 1/4 = 0.25.`,action:a=>a.logic.reciprocal()}),"+/-":new s({id:"+/-",label:"+/-",style:f,tooltip:"Toggle Sign: Changes the sign of the displayed number.",action:a=>a.logic.toggleSign()}),".":new s({id:".",label:".",style:f,tooltip:"Decimal Point: Adds a decimal point to the number.",action:a=>a.logic.inputDecimal()}),Sta:new s({id:"Sta",label:"Sta",style:T,tooltip:"Opens the Statistics Box to view and manage your data.",action:a=>a._openStatisticsWindow()}),"F-E":new s({id:"F-E",label:"F-E",style:h,tooltip:"Turns scinetific notaation on and off. Numbers larger than 10^32 are always displayed exponentially. You can use F-E only with the decimal number system.",action:a=>a.logic.toggleScientificNotation()}),"(":new s({id:"(",label:"(",style:h,tooltip:"Starts a new level of parentheses.",action:a=>a.logic.openParenthesis()}),")":new s({id:")",label:")",style:h,tooltip:"Closes a level of parentheses.",action:a=>a.logic.closeParenthesis()}),Mod:new s({id:"Mod",label:"Mod",style:u,tooltip:"Displays the remainder of a division.",action:a=>a.logic.performOperation("Mod")}),And:new s({id:"And",label:"And",style:u,tooltip:"Performs a bitwise AND operation.",action:a=>a.logic.performOperation("And")}),Ave:new s({id:"Ave",label:"Ave",style:T,tooltip:"Calculates the average of the numbers in the Statistics Box.",action:a=>a.logic.calculateAverage()}),dms:new s({id:"dms",label:"dms",style:h,tooltip:"Converts the displayed number to degree-minute-second format (assuming that the displayed number is in degrees). To convert the displayed number to degrees (assuming that the displayed number is in degree-minute-second format), use Inv+dms. You can use dms only with the decimal number system.",action:a=>a.logic.dms()}),Exp:new s({id:"Exp",label:"Exp",style:h,tooltip:"Allows entry of scientific-notation numbers. The exponent is limited to four digits. You can use only decimal digits (keys 0 through 9) in the exponent. You can use Exp only with the decimal number system.",action:a=>a.logic.expInput()}),ln:new s({id:"ln",label:"ln",style:h,tooltip:"Calculates the natural (base e) logarithm.",action:a=>a.logic.ln()}),Or:new s({id:"Or",label:"Or",style:u,tooltip:"Performs a bitwise OR operation.",action:a=>a.logic.performOperation("Or")}),Xor:new s({id:"Xor",label:"Xor",style:u,tooltip:"Performs a bitwise exclusive OR operation.",action:a=>a.logic.performOperation("Xor")}),Sum:new s({id:"Sum",label:"Sum",style:T,tooltip:"Calculates the sum of the numbers in the Statistics Box.",action:a=>a.logic.calculateSum()}),sin:new s({id:"sin",label:"sin",style:h,tooltip:"Calculates the sine of the number.",action:a=>a.logic.sin()}),"x^y":new s({id:"x^y",label:"x^y",style:h,tooltip:"Raises a number to the power of another number.",action:a=>a.logic.performOperation("x^y")}),log:new s({id:"log",label:"log",style:h,tooltip:"Calculates the common (base 10) logarithm.",action:a=>a.logic.log()}),Lsh:new s({id:"Lsh",label:"Lsh",style:u,tooltip:"Performs a bitwise left shift.",action:a=>a.logic.performOperation("Lsh")}),Not:new s({id:"Not",label:"Not",style:u,tooltip:"Performs a bitwise NOT operation.",action:a=>a.logic.not()}),s:new s({id:"s",label:"s",style:T,tooltip:"Calculates the population standard deviation of the numbers in the Statistics Box.",action:a=>a.logic.calculateStdDev()}),cos:new s({id:"cos",label:"cos",style:h,tooltip:"Calculates the cosine of the number.",action:a=>a.logic.cos()}),"x^3":new s({id:"x^3",label:"x^3",style:h,tooltip:"Calculates the cube of the number.",action:a=>a.logic.x_cubed()}),"n!":new s({id:"n!",label:"n!",style:h,tooltip:"Calculates the factorial of the number.",action:a=>a.logic.factorial()}),Int:new s({id:"Int",label:"Int",style:u,tooltip:"Displays the integer part of a number.",action:a=>a.logic.int()}),Dat:new s({id:"Dat",label:"Dat",style:T,tooltip:"Adds the current number to the Statistics Box.",action:a=>{a.logic.addToStatistics(),a._updateStatisticsDisplay()}}),tan:new s({id:"tan",label:"tan",style:h,tooltip:"Calculates the tangent of the number.",action:a=>a.logic.tan()}),"x^2":new s({id:"x^2",label:"x^2",style:h,tooltip:"Calculates the square of the number.",action:a=>a.logic.x_squared()}),pi:new s({id:"pi",label:"pi",style:f,tooltip:"Displays the value of PI.",action:a=>a.logic.pi()}),...Object.fromEntries(["A","B","C","D","E","F"].map(a=>[a,new s({id:a,label:a,style:f,tooltip:"Enters a hexadecimal digit.",action:e=>e.logic.inputDigit(a)})]))},E=`<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML//EN">
<HTML>
<HEAD>
<meta name="GENERATOR" content="Microsoft&reg; HTML Help Workshop 4.00">
<!-- Sitemap 1.0 -->
</HEAD><BODY>
<OBJECT type="text/site properties">
	<param name="Window Styles" value="0x800624">
</OBJECT>
<UL>
	<LI> <OBJECT type="text/sitemap">
		<param name="Name" value="Performing Calculations">
		</OBJECT>
	<UL>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="Perform a simple calculation ">
			<param name="Local" value="calc_simple.html">
			</OBJECT>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="Perform a statistical calculation ">
			<param name="Local" value="calc_statistics.html">
			</OBJECT>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="Perform a scientific calculation ">
			<param name="Local" value="calc_scientific.html">
			</OBJECT>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="Convert values to other number systems ">
			<param name="Local" value="calc_number_system.html">
			</OBJECT>
	</UL>
	<LI> <OBJECT type="text/sitemap">
		<param name="Name" value="Tips and Tricks">
		</OBJECT>
	<UL>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="Find out what a Calculator button does">
			<param name="Local" value="calc_buttons.html">
			</OBJECT>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="Work with numbers stored in memory">
			<param name="Local" value="calc_memory.html">
			</OBJECT>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="Use keyboard equivalents of Calculator buttons">
			<param name="Local" value="calc_list_equiv.html">
			</OBJECT>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="Use key sequences as functions">
			<param name="Local" value="calc_keyboard_seq.html">
			</OBJECT>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="Understanding extended precision">
			<param name="Local" value="calc_precision.html">
			</OBJECT>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="Transfer numbers between standard and scientific view">
			<param name="Local" value="calc_transfer.html">
			</OBJECT>
	</UL>
</UL>
</BODY></HTML>
`,x=`<HTML>
<HEAD>
<!-- Sitemap 1.0 -->
</HEAD>
<BODY>
<OBJECT type="text/site properties">
	<param name="FrameName" value="current">
</OBJECT>

<UL>
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="- (subtraction operator)">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="* (multiplication operator)">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="/ (division operator)">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="\\ (backslash)">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="+ (addition operator)">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="accuracy of Calculator">
	<param name="Name" value="Understanding extended precision">
	<param name="Local" value="calc_precision.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="adding">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To work with numbers stored in memory">
	<param name="Local" value="calc_memory.html">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="asterisk (multiplication operator)">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="backslash">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="binary calculations">
	<param name="Name" value="To convert a value to another number system">
	<param name="Local" value="calc_number_system.html">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="buttons">
	<param name="Name" value="To see what a Calculator button does">
	<param name="Local" value="calc_buttons.html">
	<param name="Name" value="Using keyboard equivalents of Calculator buttons">
	<param name="Local" value="calc_list_equiv.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="calculations">
	<param name="Name" value="To work with numbers stored in memory">
	<param name="Local" value="calc_memory.html">
	<param name="Name" value="To convert a value to another number system">
	<param name="Local" value="calc_number_system.html">
	<param name="Name" value="Understanding extended precision">
	<param name="Local" value="calc_precision.html">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
	<param name="Name" value="To perform a statistical calculation">
	<param name="Local" value="calc_statistics.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="clearing values">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To work with numbers stored in memory">
	<param name="Local" value="calc_memory.html">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="converting values">
	<param name="Name" value="To convert a value to another number system">
	<param name="Local" value="calc_number_system.html">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="copying data">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="decimal calculations">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To convert a value to another number system">
	<param name="Local" value="calc_number_system.html">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="display area">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="displaying numbers from memory">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To work with numbers stored in memory">
	<param name="Local" value="calc_memory.html">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="dividing">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="entering numbers">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="equals sign">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="extended precision">
	<param name="Name" value="Understanding extended precision">
	<param name="Local" value="calc_precision.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="functions">
	<param name="Name" value="To see what a Calculator button does">
	<param name="Local" value="calc_buttons.html">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="Help on buttons">
	<param name="Name" value="To see what a Calculator button does">
	<param name="Local" value="calc_buttons.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="hexadecimal calculations">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To convert a value to another number system">
	<param name="Local" value="calc_number_system.html">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="irrational numbers, accuracy">
	<param name="Name" value="Understanding extended precision">
	<param name="Local" value="calc_precision.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="keyboard equivalents">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="Using keyboard equivalents of Calculator buttons">
	<param name="Local" value="calc_list_equiv.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="keyboard sequences">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="keypad">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
	<param name="Name" value="To perform a statistical calculation">
	<param name="Local" value="calc_statistics.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="memory">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To work with numbers stored in memory">
	<param name="Local" value="calc_memory.html">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="minus sign">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="multiplying">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="NUM LOCK key">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
	<param name="Name" value="To perform a statistical calculation">
	<param name="Local" value="calc_statistics.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="numbers">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To work with numbers stored in memory">
	<param name="Local" value="calc_memory.html">
	<param name="Name" value="To convert a value to another number system">
	<param name="Local" value="calc_number_system.html">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
	<UL>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="adding">
		<param name="Name" value="Using key sequences as functions">
		<param name="Local" value="calc_keyboard_seq.html">
		<param name="Name" value="To work with numbers stored in memory">
		<param name="Local" value="calc_memory.html">
		<param name="Name" value="To perform a simple calculation">
		<param name="Local" value="calc_simple.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="clearing">
		<param name="Name" value="Using key sequences as functions">
		<param name="Local" value="calc_keyboard_seq.html">
		<param name="Name" value="To work with numbers stored in memory">
		<param name="Local" value="calc_memory.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="converting">
		<param name="Name" value="To convert a value to another number system">
		<param name="Local" value="calc_number_system.html">
		<param name="Name" value="To transfer numbers between Standard and Scientific view">
		<param name="Local" value="calc_transfer.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="dividing">
		<param name="Name" value="To perform a simple calculation">
		<param name="Local" value="calc_simple.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="in memory">
		<param name="Name" value="Using key sequences as functions">
		<param name="Local" value="calc_keyboard_seq.html">
		<param name="Name" value="To work with numbers stored in memory">
		<param name="Local" value="calc_memory.html">
		<param name="Name" value="To transfer numbers between Standard and Scientific view">
		<param name="Local" value="calc_transfer.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="multiplying">
		<param name="Name" value="To perform a simple calculation">
		<param name="Local" value="calc_simple.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="subtracting">
		<param name="Name" value="To perform a simple calculation">
		<param name="Local" value="calc_simple.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="systems">
		<param name="Name" value="To convert a value to another number system">
		<param name="Local" value="calc_number_system.html">
	</OBJECT>
	</UL>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="numeric keypad">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
	<param name="Name" value="To perform a statistical calculation">
	<param name="Local" value="calc_statistics.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="octal calculations">
	<param name="Name" value="To convert a value to another number system">
	<param name="Local" value="calc_number_system.html">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="operators">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
	<param name="Name" value="To perform a statistical calculation">
	<param name="Local" value="calc_statistics.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="pasting data">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="plus sign">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="precision">
	<param name="Name" value="Understanding extended precision">
	<param name="Local" value="calc_precision.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="rational numbers">
	<param name="Name" value="Understanding extended precision">
	<param name="Local" value="calc_precision.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="recalling numbers from memory">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To work with numbers stored in memory">
	<param name="Local" value="calc_memory.html">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="scientific calculations">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To convert a value to another number system">
	<param name="Local" value="calc_number_system.html">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
	<param name="Name" value="To perform a statistical calculation">
	<param name="Local" value="calc_statistics.html">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="showing numbers in memory">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To work with numbers stored in memory">
	<param name="Local" value="calc_memory.html">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="simple calculations">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="slash (division operator)">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="standard view">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="statistical calculations">
	<param name="Name" value="To see what a Calculator button does">
	<param name="Local" value="calc_buttons.html">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To perform a statistical calculation">
	<param name="Local" value="calc_statistics.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="storing numbers in memory">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To work with numbers stored in memory">
	<param name="Local" value="calc_memory.html">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="subtracting">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="systems, number">
	<param name="Name" value="To convert a value to another number system">
	<param name="Local" value="calc_number_system.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="tips on buttons">
	<param name="Name" value="To see what a Calculator button does">
	<param name="Local" value="calc_buttons.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="transferring numbers between views">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="values">
	<param name="Name" value="Using key sequences as functions">
	<param name="Local" value="calc_keyboard_seq.html">
	<param name="Name" value="To work with numbers stored in memory">
	<param name="Local" value="calc_memory.html">
	<param name="Name" value="To convert a value to another number system">
	<param name="Local" value="calc_number_system.html">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
</OBJECT>
	<UL>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="adding">
		<param name="Name" value="Using key sequences as functions">
		<param name="Local" value="calc_keyboard_seq.html">
		<param name="Name" value="To work with numbers stored in memory">
		<param name="Local" value="calc_memory.html">
		<param name="Name" value="To perform a simple calculation">
		<param name="Local" value="calc_simple.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="clearing">
		<param name="Name" value="Using key sequences as functions">
		<param name="Local" value="calc_keyboard_seq.html">
		<param name="Name" value="To work with numbers stored in memory">
		<param name="Local" value="calc_memory.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="converting">
		<param name="Name" value="To convert a value to another number system">
		<param name="Local" value="calc_number_system.html">
		<param name="Name" value="To transfer numbers between Standard and Scientific view">
		<param name="Local" value="calc_transfer.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="dividing">
		<param name="Name" value="To perform a simple calculation">
		<param name="Local" value="calc_simple.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="in memory">
		<param name="Name" value="Using key sequences as functions">
		<param name="Local" value="calc_keyboard_seq.html">
		<param name="Name" value="To work with numbers stored in memory">
		<param name="Local" value="calc_memory.html">
		<param name="Name" value="To transfer numbers between Standard and Scientific view">
		<param name="Local" value="calc_transfer.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="multiplying">
		<param name="Name" value="To perform a simple calculation">
		<param name="Local" value="calc_simple.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="subtracting">
		<param name="Name" value="To perform a simple calculation">
		<param name="Local" value="calc_simple.html">
	</OBJECT>
	<LI><OBJECT type="Text/sitemap">
		<param name="Name" value="systems">
		<param name="Name" value="To convert a value to another number system">
		<param name="Local" value="calc_number_system.html">
	</OBJECT>
	</UL>
<LI><OBJECT type="Text/sitemap">
	<param name="Name" value="views">
	<param name="Name" value="To perform a scientific calculation">
	<param name="Local" value="calc_scientific.html">
	<param name="Name" value="To perform a simple calculation">
	<param name="Local" value="calc_simple.html">
	<param name="Name" value="To perform a statistical calculation">
	<param name="Local" value="calc_statistics.html">
	<param name="Name" value="To transfer numbers between Standard and Scientific view">
	<param name="Local" value="calc_transfer.html">
</OBJECT>
</UL>
</HTML>
`;class I extends _{static config={id:"calculator",title:"Calculator",description:"Perform calculations.",icon:C.calculator,category:"Accessories",width:260,height:280,resizable:!1};constructor(e){super(e),this.win=null,this.logic=new L,this.mode="standard",this.statisticsWindow=null,this.areStatisticsButtonsActive=!1,this.selectedStatisticsIndex=-1}_createWindow(){this.win=new $Window({id:this.id,title:this.title,resizable:!1,icons:this.icon,maximizable:!1});const e=this._createMenuBar();return this.win.setMenuBar(e),this.win.$content.html(`
            <div class="calculator-container">
                <div class="calculator-display-container">
                    <div class="calculator-display inset-deep">0.</div>
                </div>
                <div class="calculator-buttons"></div>
            </div>
        `),this._renderButtons(),this._updateDisplay(),this._updateNestingLevelDisplay(),this.win}_createMenuBar(){return new MenuBar({"&Edit":[{label:"&Copy",shortcutLabel:"Ctrl+C",action:()=>this._copyToClipboard()},{label:"&Paste",shortcutLabel:"Ctrl+V",action:()=>this._pasteFromClipboard()}],"&View":[{radioItems:[{label:"&Standard",value:"standard"},{label:"Sc&ientific",value:"scientific"}],getValue:()=>this.mode,setValue:e=>this._setMode(e)}],"&Help":[{label:"Help &Topics",action:()=>window.System.launchApp("help",{title:"Calculator Help",hhc:E,hhk:x,baseUrl:"/win98-web/apps/calculator/help"})},{label:"&About Calculator",action:()=>this._showAboutDialog()}]})}_setMode(e){this.mode!==e&&(this.mode=e,this._renderButtons(),this.win.element.querySelector(".menus").dispatchEvent(new CustomEvent("update")),this._updateNestingLevelDisplay())}_renderButtons(){const e=this.win.$content.find(".calculator-buttons")[0];e.innerHTML="";const t=this.win.$content.find(".scientific-controls")[0];t&&t.remove();const n=this.mode==="standard"?this._getStandardLayout():this._getScientificLayout();if(this.mode==="scientific"&&this._renderScientificControls(),this.mode==="standard"){const i=document.createElement("div");i.className="standard-layout-container";const l=document.createElement("div");l.className="memory-section",l.innerHTML='<div id="memory-indicator" class="inset-deep calc-indicator"></div>';const o=document.createElement("div");o.className="memory-buttons",n.memory.forEach(v=>{const p=b[v];p&&o.appendChild(p.render(this))}),l.appendChild(o),i.appendChild(l);const m=document.createElement("div");m.className="main-area";const r=document.createElement("div");r.className="control-buttons",n.controls.forEach(v=>{const p=b[v];p&&r.appendChild(p.render(this))}),m.appendChild(r);const d=document.createElement("div");d.className="main-buttons",n.main.forEach(v=>{v.forEach(p=>{const c=b[p];c&&d.appendChild(c.render(this))})}),m.appendChild(d),i.appendChild(m),e.appendChild(i)}else{const i=document.createElement("div");i.className="scientific-layout-container";const l=document.createElement("div");l.className="calc-sci-button-group sta-group",n.sta.forEach(p=>{const c=b[p];c&&l.appendChild(c.render(this))}),i.appendChild(l);const o=document.createElement("div");o.className="calc-sci-button-group functions-group",n.functions.forEach(p=>{const c=document.createElement("div");c.className="button-column",p.forEach(g=>{const y=b[g];y&&c.appendChild(y.render(this))}),o.appendChild(c)}),i.appendChild(o);const m=document.createElement("div");m.className="calc-sci-button-group memory-group",n.memory.forEach(p=>{const c=b[p];c&&m.appendChild(c.render(this))}),i.appendChild(m);const r=document.createElement("div");r.className="calc-sci-button-group main-group",n.main.forEach(p=>{const c=document.createElement("div");c.className="button-row",p.forEach(g=>{const y=b[g];y&&c.appendChild(y.render(this))}),r.appendChild(c)}),i.appendChild(r),e.appendChild(i);const d=document.createElement("div");d.className="control-buttons",n.controls.forEach(p=>{const c=b[p];c&&d.appendChild(c.render(this))}),this.win.$content.find(".control-row-bottom")[0].appendChild(d)}this._updateMemoryIndicator(),this.mode==="scientific"&&(this._updateHexButtonState(),this._updateStatisticsButtonState())}_getStandardLayout(){return{memory:["MC","MR","MS","M+"],controls:["Backspace","CE","Clear"],main:[["7","8","9","/","sqrt"],["4","5","6","*","%"],["1","2","3","-","1/x"],["0","+/-",".","+","="]]}}_getScientificLayout(){return{sta:["Sta","Ave","Sum","s","Dat"],functions:[["F-E","dms","sin","cos","tan"],["(","Exp","x^y","x^3","x^2"],[")","ln","log","n!","1/x"]],memory:["MC","MR","MS","M+","pi"],controls:["Backspace","CE","Clear"],main:[["7","8","9","/","Mod","And"],["4","5","6","*","Or","Xor"],["1","2","3","-","Lsh","Not"],["0","+/-",".","+","=","Int"],["A","B","C","D","E","F"]]}}_renderScientificControls(){this.win.$content.find(".calculator-display-container")[0].insertAdjacentHTML("afterend",`
            <div class="scientific-controls">
                <div class="control-row">
                    <fieldset class="group-box">
                        <div class="field-row" data-tooltip-id="hex"><input type="radio" name="number-system" id="hex" value="16"><label for="hex">Hex</label></div>
                        <div class="field-row" data-tooltip-id="dec"><input type="radio" name="number-system" id="dec" value="10" checked><label for="dec">Dec</label></div>
                        <div class="field-row" data-tooltip-id="oct"><input type="radio" name="number-system" id="oct" value="8"><label for="oct">Oct</label></div>
                        <div class="field-row" data-tooltip-id="bin"><input type="radio" name="number-system" id="bin" value="2"><label for="bin">Bin</label></div>
                    </fieldset>
                    <fieldset class="group-box angle-measure-group">
                        <div class="field-row" data-tooltip-id="degrees"><input type="radio" name="angle-measure" id="degrees" value="degrees" checked><label for="degrees">Degrees</label></div>
                        <div class="field-row" data-tooltip-id="radians"><input type="radio" name="angle-measure" id="radians" value="radians"><label for="radians">Radians</label></div>
                        <div class="field-row" data-tooltip-id="gradients"><input type="radio" name="angle-measure" id="gradients" value="gradients"><label for="gradients">Gradients</label></div>
                    </fieldset>
                    <fieldset class="group-box word-size-group" style="display: none;">
                        <div class="field-row" data-tooltip-id="dword"><input type="radio" name="word-size" id="dword" value="32" checked><label for="dword">Dword</label></div>
                        <div class="field-row" data-tooltip-id="word"><input type="radio" name="word-size" id="word" value="16"><label for="word">Word</label></div>
                        <div class="field-row" data-tooltip-id="byte"><input type="radio" name="word-size" id="byte" value="8"><label for="byte">Byte</label></div>
                    </fieldset>
                </div>
                <div class="control-row control-row-bottom">
                  <fieldset class="group-box calc-func-switch">
                    <div class="checkbox-container" data-tooltip-id="inv"><input type="checkbox" id="inv"><label for="inv">Inv</label></div>
                    <div class="checkbox-container" data-tooltip-id="hyp"><input type="checkbox" id="hyp"><label for="hyp">Hyp</label></div>
                  </fieldset>
                  <div id="nesting-level-indicator" class="inset-deep calc-indicator"></div>
                  <div id="memory-indicator" class="inset-deep calc-indicator"></div>
                  <div style="width: 44px;"></div>
                </div>
            </div>
        `),Object.entries({hex:"Hexadecimal (base 16)",dec:"Decimal (base 10)",oct:"Octal (base 8)",bin:"Binary (base 2)",degrees:"Degrees",radians:"Radians",gradients:"Gradians",inv:`Sets the inverse function for sin, cos, tan, PI, x^y, x^2, x^3, ln, log, Ave, Sum, and s.
The functions automatically turn off the inverse function after a calculation is completed.`,hyp:`Sets the hyperbolic function for sin, cos, and tan.
The functions automatically turn off the hyperbolic function after a calculation is completed.`,dword:"Convert the displayed number to full 32-bit representation.",word:"Convert the displayed number to 16-bit representation.",byte:"Convert the displayed number to 8-bit representation."}).forEach(([o,m])=>{const r=this.win.$content.find(`[data-tooltip-id="${o}"]`)[0];r&&r.addEventListener("contextmenu",d=>{d.preventDefault(),new window.ContextMenu([{label:"What's this?",action:()=>new N(m,r)}],d)})}),$.each(this.win.$content.find('input[name="number-system"]'),(o,m)=>{m.addEventListener("change",r=>this._handleBaseChange(parseInt(r.target.value)))}),$.each(this.win.$content.find('input[name="angle-measure"]'),(o,m)=>{m.addEventListener("change",r=>this.logic.setAngleUnit(r.target.value))}),$.each(this.win.$content.find('input[name="word-size"]'),(o,m)=>{m.addEventListener("change",r=>{this.logic.setWordSize(parseInt(r.target.value)),this._updateDisplay()})});const i=this.win.$content.find("#inv")[0];i&&i.addEventListener("change",()=>{this.logic.toggleInverse()});const l=this.win.$content.find("#hyp")[0];l&&l.addEventListener("change",()=>{this.logic.toggleHyperbolic()})}_handleBaseChange(e){this.logic.setBase(e),this._updateDisplay(),this._updateHexButtonState(),this._updateScientificControlsVisibility(e)}_updateScientificControlsVisibility(e){const t=this.win.$content.find(".angle-measure-group")[0],n=this.win.$content.find(".word-size-group")[0];e===10?(t.style.display="",n.style.display="none"):(t.style.display="none",n.style.display="")}_updateHexButtonState(){const e=this.win.$content.find('[data-id="A"], [data-id="B"], [data-id="C"], [data-id="D"], [data-id="E"], [data-id="F"]'),t=this.logic.base!==16;Array.from(e).forEach(n=>n.disabled=t)}_updateMemoryIndicator(){const e=this.win.$content.find("#memory-indicator")[0];e&&(e.textContent=this.logic.memory!==0?"M":"")}_updateDisplay(){const e=this.win.$content.find(".calculator-display")[0];e.textContent=this.logic.currentValue}_updateNestingLevelDisplay(){const e=this.win.$content.find("#nesting-level-indicator")[0];if(!e)return;const t=this.logic.getParenthesisLevel();t>0?e.textContent=`( = ${t}`:e.textContent=""}_updateCheckboxes(){const e=this.win.$content.find("#inv")[0],t=this.win.$content.find("#hyp")[0];e&&(e.checked=this.logic.isInverse),t&&(t.checked=this.logic.isHyperbolic)}_copyToClipboard(){navigator.clipboard.writeText(this.logic.currentValue).catch(e=>{console.error("Could not copy text: ",e)})}_pasteFromClipboard(){navigator.clipboard.readText().then(e=>{!isNaN(parseFloat(e))&&isFinite(e)&&(this.logic.currentValue=e,this.logic.isNewNumber=!0,this._updateDisplay())}).catch(e=>{console.error("Could not paste text: ",e)})}_showAboutDialog(){w({title:"About Calculator",text:"A Windows 98 style calculator.",buttons:[{label:"OK",isDefault:!0}]})}_onLaunch(e){this.win.element.addEventListener("keydown",t=>{t.preventDefault(),this._handleKeyPress(t.key)}),this.win.element.addEventListener("button-action-complete",()=>{this._updateDisplay(),this._updateNestingLevelDisplay(),this._updateCheckboxes()})}_triggerButtonAction(e){const t=b[e];t&&t.action&&(this.win.element.dispatchEvent(new CustomEvent("button-action-start")),t.action(this),this.win.element.dispatchEvent(new CustomEvent("button-action-complete")))}_handleKeyPress(e){e==="Enter"&&(e="="),e==="Escape"&&(e="C"),this._triggerButtonAction(e)}_openStatisticsWindow(){if(this.statisticsWindow&&!this.statisticsWindow.closed){this.statisticsWindow.focus();return}this.statisticsWindow=new $Window({title:"Statistics Box",outerWidth:200,outerHeight:250,resizable:!1,maximizeButton:!1,minimizeButton:!1,icons:C.windows}),this.statisticsWindow.$content.html(`
      <div class="statistics-container" style="display: flex; flex-direction: column; height: 100%; padding: 5px;">
        <ul class="statistics-list inset-deep" style="flex-grow: 1; margin: 0; padding: 0; height: 100px;"></ul>
        <div class="statistics-buttons" style="display: flex; justify-content: space-around; margin: 5px 0;">
          <button data-action="ret">RET</button>
          <button data-action="load">LOAD</button>
          <button data-action="cd">CD</button>
          <button data-action="cad">CAD</button>
        </div>
        <div class="statistics-count" style="text-align: center;">n=0</div>
      </div>
    `),this._setupStatisticsEventListeners(),this.areStatisticsButtonsActive=!0,this.selectedStatisticsIndex=this.logic.statisticsData.length>0?0:-1,this._updateStatisticsButtonState(),this._updateStatisticsDisplay(),this.statisticsWindow.onClosed=()=>{this.areStatisticsButtonsActive=!1,this._updateStatisticsButtonState(),this.statisticsWindow=null,this.selectedStatisticsIndex=-1}}_setupStatisticsEventListeners(){const e=this.statisticsWindow.$content;e.on("click",".statistics-list li",n=>{const i=$(n.currentTarget).index();this.selectedStatisticsIndex=i,this._updateStatisticsDisplay()}),e.on("click","button[data-action='ret']",()=>this.win.focus()),e.on("click","button[data-action='load']",()=>{this.selectedStatisticsIndex!==-1&&(this.logic.currentValue=this.logic.statisticsData[this.selectedStatisticsIndex],this.logic.isNewNumber=!0,this._updateDisplay())}),e.on("click","button[data-action='cd']",()=>{this.selectedStatisticsIndex!==-1&&(this.logic.statisticsData.splice(this.selectedStatisticsIndex,1),this.selectedStatisticsIndex>=this.logic.statisticsData.length&&(this.selectedStatisticsIndex=this.logic.statisticsData.length-1),this._updateStatisticsDisplay())}),e.on("click","button[data-action='cad']",()=>{this.logic.statisticsData=[],this.selectedStatisticsIndex=-1,this._updateStatisticsDisplay()}),Object.entries({ret:"Return: Closes the Statistics Box and returns to the calculator.",load:"Load: Copies the selected number to the calculator display.",cd:"Clear Data: Removes the selected number from the list.",cad:"Clear All Data: Removes all numbers from the list."}).forEach(([n,i])=>{const l=e.find(`button[data-action='${n}']`)[0];l&&$(l).on("contextmenu",o=>{o.preventDefault(),new window.ContextMenu([{label:"What's this?",action:()=>{new N(i,l)}}],o)})})}_updateStatisticsButtonState(){["Ave","Sum","s","Dat"].forEach(t=>{const n=this.win.$content.find(`[data-id="${t}"]`)[0];n&&(n.disabled=!this.areStatisticsButtonsActive)})}_updateStatisticsDisplay(){if(!this.statisticsWindow||this.statisticsWindow.closed)return;const e=this.statisticsWindow.$content.find(".statistics-list"),t=this.statisticsWindow.$content.find(".statistics-count"),n=this.statisticsWindow.$content.find(".statistics-buttons button");e.empty(),this.logic.statisticsData.forEach((r,d)=>{const v=$(`<li>${r}</li>`);d===this.selectedStatisticsIndex&&v.addClass("highlighted"),e.append(v)});const i=this.logic.statisticsData.length;t.text(`n=${i}`);const l=this.selectedStatisticsIndex!==-1,o=i>0;n.filter("[data-action='load']").prop("disabled",!l),n.filter("[data-action='cd']").prop("disabled",!l),n.filter("[data-action='cad']").prop("disabled",!o);const m=e[0];m&&(m.scrollTop=m.scrollHeight)}}export{I as CalculatorApp};
