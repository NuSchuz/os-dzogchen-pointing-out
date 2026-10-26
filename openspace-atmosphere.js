/* OpenSpace hybrid. Additive to V8: original buttons, state, sequences and handlers are unchanged. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
function init(){
 const host=$('container'), menu=$('menuBar'), card=$('card'), content=$('content');
 if(!host||!menu||!card||!content) { console.warn('OpenSpace hybrid: V8 host not detected'); return; }
 // Continuous ambient field. WebGL shader; fallback remains a dark stable background.
 const canvas=document.createElement('canvas');canvas.id='os-field';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
 const vignette=document.createElement('div');vignette.id='os-vignette';document.body.insertBefore(vignette,canvas.nextSibling);
 let gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
 let running=true, frame=0, last=0, elapsed=0, program,positionLoc,timeLoc,resLoc,buffer;
 const vertex=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
 const fragment=`precision mediump float;
 uniform vec2 r;uniform float t;
 float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
 float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float fbm(vec3 p){float v=0.,a=.52;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+12.13;a*=.48;}return v;}
 void main(){vec2 uv=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);float time=t*.008;
 vec2 flow=vec2(sin(time*.37),cos(time*.28))*.22;
 vec3 p=vec3(uv*1.32+flow,time*.26);
 float a=fbm(p+vec3(fbm(p*.8),fbm(p*1.12),0.)*.8);
 float b=fbm(p*1.37+vec3(3.9,2.3,2.1));
 float n=smoothstep(.29,.76,a+.12*b);
 float center=exp(-dot(uv-vec2(-.22,-.02),uv-vec2(-.22,-.02))*1.5);
 float cloud1=pow(max(0.,n),1.9)*center;
 float cloud2=pow(max(0.,fbm(p*.88+vec3(8.3,4.2,1.7))-.31),1.3)*1.9;
 vec3 color=vec3(.024,.036,.069);
 color+=vec3(.31,.17,.30)*cloud1*.62;
 color+=vec3(.39,.19,.13)*cloud2*.26;
 color+=vec3(.08,.13,.29)*exp(-dot(uv-vec2(.55,.20),uv-vec2(.55,.20))*2.4)*(.17+.65*b);
 color+=vec3(.15,.10,.20)*exp(-dot(uv-vec2(-.4,.56),uv-vec2(-.4,.56))*2.1)*(.22+.40*a);
 color*=.92+ .08*sin(uv.y*2.3+time*.3);
 color=pow(max(color,0.),vec3(.89));gl_FragColor=vec4(color,1.);
 }`;
 function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 try { if(!gl)throw Error('WebGL unsupported'); program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);positionLoc=gl.getAttribLocation(program,'p');timeLoc=gl.getUniformLocation(program,'t');resLoc=gl.getUniformLocation(program,'r');buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(positionLoc);gl.vertexAttribPointer(positionLoc,2,gl.FLOAT,false,0,0); } catch(e){console.warn('OpenSpace atmosphere: static fallback',e);gl=null;canvas.style.background='radial-gradient(ellipse at 45% 48%, #372437 0%, #11182a 49%, #070b15 100%)';}
 let w=0,h=0;
 function render(ms){if(!running||!gl)return;if(document.hidden){requestAnimationFrame(render);return;}if(ms-last<55){requestAnimationFrame(render);return;}const delta=last?Math.min((ms-last)/1000,.1):0;last=ms;elapsed+=delta;
 const scale=Math.min(window.devicePixelRatio||1,1.1)*.62;
 const nw=Math.max(1,Math.round(innerWidth*scale)),nh=Math.max(1,Math.round(innerHeight*scale));if(w!==nw||h!==nh){canvas.width=w=nw;canvas.height=h=nh;gl.viewport(0,0,w,h);}gl.uniform2f(resLoc,w,h);gl.uniform1f(timeLoc,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);requestAnimationFrame(render);}
 if(gl){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){canvas.width= Math.max(1,Math.round(innerWidth*.5));canvas.height=Math.max(1,Math.round(innerHeight*.5));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(resLoc,canvas.width,canvas.height);gl.uniform1f(timeLoc,14);gl.drawArrays(gl.TRIANGLES,0,6);}else requestAnimationFrame(render);}
 const toggle=document.createElement('button');toggle.id='os-atmosphere-toggle';toggle.textContent='Atmosphere: on';toggle.setAttribute('aria-label','Toggle ambient motion');toggle.addEventListener('click',()=>{running=!running;toggle.textContent='Atmosphere: '+(running?'on':'paused');if(running&&gl){last=0;requestAnimationFrame(render);}});document.body.append(toggle);
 // Optional original inquiry inspired by Time, Space, Knowledge. No original V8 globals overwritten.
 const steps=[
 ['The apparent center','Notice the sense that experience is happening from somewhere.\n\nWithout moving attention away from experience, where is that somewhere?'],
 ['Here and there','A sound seems to occur over there. A sensation seems to occur here.\n\nWhat makes one appearance here and another there?\n\nIs the boundary itself experienced?'],
 ['The space of appearances','Notice the apparent space between objects, sensations, and thoughts.\n\nIs space something separate from what appears within it?'],
 ["The observer’s position",'There may still be a sense of looking out from behind the eyes.\n\nThat position, too, is appearing.\n\nWhat knows it?'],
 ['The arrival of the present','Notice a thought arriving.\n\nDid you experience its future before its arrival?\n\nCan you find the instant when future becomes present?'],
 ['The continuity of someone','A moment ago is remembered. A moment ahead is anticipated.\n\nWhere is the one who travels between them?\n\nIs that traveler anything other than what appears now?'],
 ['Knowing without distance','A sound is present. Its knowing is present.\n\nCan you find a distance between the sound and its being known?'],
 ['The last subtle division','Even the impression of an open space in which everything happens is known.\n\nDoes knowing stand outside what appears?\n\nOr is that separation only another appearance?'],
 ['Nothing to maintain','Let everything be ordinary.\n\nThoughts, movement, uncertainty, and the sense of being someone may continue.\n\nDoes any of this require a separate knower?\n\nNothing needs to be held in place.']
 ];
 const button=document.createElement('button');button.id='os-tsk-btn';button.textContent='Space, Time, Knowing';button.title='A new original inquiry inspired by Tarthang Tulku’s Time, Space, Knowledge';menu.append(button);
 const panel=document.createElement('section');panel.id='os-tsk-panel';panel.hidden=true;panel.innerHTML='<p id="os-tsk-eyebrow">Space · Time · Knowing</p><h2 id="os-tsk-title"></h2><div id="os-tsk-text"></div><div id="os-tsk-footer"><button class="os-tsk-action" id="os-tsk-prev">Previous</button><span id="os-tsk-progress"></span><button class="os-tsk-action" id="os-tsk-next">Continue</button></div>';
 card.append(panel);let step=0,active=false;const prev=$('os-tsk-prev'),next=$('os-tsk-next');
 function update(){ $('os-tsk-title').textContent=steps[step][0];$('os-tsk-text').textContent=steps[step][1];$('os-tsk-progress').textContent=(step+1)+' / '+steps.length;prev.disabled=step===0;next.textContent=step===steps.length-1?'Begin again':'Continue';}
 const originalChildren=[...card.children].filter(x=>x!==panel);
 function activate(){active=true;step=0;originalChildren.forEach(n=>n.style.setProperty('display','none','important'));panel.hidden=false;panel.style.display='block';update();menu.style.display='none';if($('menuToggleBtn'))$('menuToggleBtn').setAttribute('aria-expanded','false');}
 function deactivate(){if(!active)return;active=false;panel.hidden=true;panel.style.display='none';originalChildren.forEach(n=>n.style.removeProperty('display'));}
 button.addEventListener('click',activate);
 for(const id of ['rushenBtn','mahaBtn','dzPOBtn','trekchoBtn','dzogchenBtn']) $(id)?.addEventListener('click',deactivate,{capture:true});
 prev.addEventListener('click',()=>{if(step>0){step--;update();}});next.addEventListener('click',()=>{step=(step+1)%steps.length;update();});
 document.addEventListener('keydown',e=>{if(!active||e.target.closest('button,input,textarea'))return;if(e.key==='ArrowRight'){next.click();}else if(e.key==='ArrowLeft'){prev.click();}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
