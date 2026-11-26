// Aspect-preserving frame geometry for explicit Fit and Fill modes.
export function videoAspect(width,height){const ratio=Number(width)/Number(height);return Number.isFinite(ratio)&&ratio>=.5&&ratio<=2.5?ratio:16/9;}
export function fitVideo(width,height,ratio=16/9){ratio=videoAspect(ratio,1);const w=Math.max(0,Number(width)||0),h=Math.max(0,Number(height)||0);const fittedW=Math.min(w,h*ratio);return {width:fittedW,height:fittedW/ratio,left:(w-fittedW)/2,top:(h-fittedW/ratio)/2};}
// Intentional cover crop for album-art videos. Fit remains available to restore edges.
export function fillVideo(width,height,ratio=16/9){ratio=videoAspect(ratio,1);const w=Math.max(0,Number(width)||0),h=Math.max(0,Number(height)||0);const coveredW=Math.max(w,h*ratio);return {width:coveredW,height:coveredW/ratio,left:(w-coveredW)/2,top:(h-coveredW/ratio)/2};}
// Native controls always win over the decorative album-art crop.
export function playerFrame(width,height,ratio,{fill=false,interacting=false,playing=false,buffering=false}={}){
 return fill&&playing&&!interacting&&!buffering?fillVideo(width,height,ratio):fitVideo(width,height,ratio);
}
