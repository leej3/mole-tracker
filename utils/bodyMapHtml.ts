import { Mole } from "@/context/AppContext";
import { CONCERN_SCORE_COLORS } from "@/utils/scoring";

export interface PinPlacedEvent {
  x: number; y: number; z: number;
  normalX: number; normalY: number; normalZ: number;
  region: string; bodyPart: string;
  view: "front" | "back";
}
export interface BodyMap3DHandle { sendMessage: (msg: object) => void; }
export interface BodyMap3DProps {
  moles: Mole[];
  onPinPlaced?: (event: PinPlacedEvent) => void;
  onMoleTapped?: (moleId: string) => void;
  onBodyPartSelected?: (bodyPart: string, label: string) => void;
  onGoBack?: () => void;
  onViewChanged?: (view: "front" | "back") => void;
  interactive?: boolean;
  gender?: string;
  width: number; height: number;
}

// ─── Body polygon data (SVG viewBox 0 0 100 220) ─────────────────────────────
// Each part has id + pts (array of polygon point strings, x/y pairs space-separated)
type BodyPart = { id: string; pts: string[] };

const ANT: BodyPart[] = [
  { id: "head",           pts: ["42.4 2.9 40 11.8 42 19.6 46.1 23.3 49.8 25.3 54.7 22.4 57.6 19.2 59.2 10.2 57.1 2.4 49.8 0"] },
  { id: "neck",           pts: ["55.5 23.7 50.6 33.5 50.6 39.2 61.6 40 70.6 44.9 69.4 36.7 63.3 35.1 58.4 30.6", "29 44.9 30.2 37.1 36.3 35.1 41.2 30.2 44.5 24.9 49 33.9 48.6 39.2 38 39.6"] },
  { id: "right_shoulder", pts: ["78.4 53.1 79.6 47.8 79.2 41.2 75.9 38 71 36.3 72.2 42.9 71.4 47.3"] },
  { id: "left_shoulder",  pts: ["28.2 47.3 21.2 53.1 20 47.8 20.4 40.8 24.5 37.1 28.6 37.1 26.9 43.3"] },
  { id: "chest",          pts: ["51.8 41.6 51 55.1 57.9 57.9 67.8 55.5 70.6 47.3 62 41.6", "29.8 46.5 31.4 55.5 40.8 57.9 48.2 55.1 47.8 42 37.6 42"] },
  { id: "right_upper_arm",pts: ["69.4 55.5 69.4 61.6 75.9 72.7 77.6 70.2 75.5 67.3", "71.4 49.4 70.2 54.7 76.3 66.1 81.6 71.8 82.9 69 78.8 55.5"] },
  { id: "left_upper_arm", pts: ["22.4 69.4 29.8 55.5 29.8 60.8 22.9 73", "16.7 68.2 18 71.4 22.9 66.1 29 53.9 27.8 49.4 20.4 55.9"] },
  { id: "abdomen",        pts: ["56.3 59.2 57.9 64.1 58.4 78 58.4 92.7 56.3 98.4 55.1 104.1 51.4 107.8 51 84.5 50.6 67.3 51 57.1", "43.7 58.8 48.6 57.1 49 67.3 48.6 84.5 48.2 107.3 44.9 103.7 40.8 91.4 40.8 78.4 41.2 64.5"] },
  { id: "lower_abdomen",  pts: ["68.6 63.3 67.3 57.1 58.8 59.6 60 64.1 60.4 83.3 65.7 78.8 66.5 69.8", "33.9 78.4 33.1 71.8 31 63.3 32.2 57.1 40.8 59.2 39.2 63.3 39.2 83.7"] },
  { id: "right_forearm",  pts: ["84.5 69.8 83.3 73.5 80 73.1 95.1 98.4 100 100.4 93.5 89.4 89.8 76.3", "77.6 72.2 77.6 77.6 80.4 84.1 85.3 89.8 92.2 101.2 94.7 99.6"] },
  { id: "left_forearm",   pts: ["6.1 88.6 10.2 75.1 14.7 70.2 16.3 74.3 19.2 73.5 4.5 97.6 0 100", "6.9 101.2 13.5 90.6 18.8 84.1 21.6 77.1 21.2 71.8 4.9 98.8"] },
  { id: "hips",           pts: ["52.7 110.2 54.3 124.9 60 110.2 62 100 64.9 94.3 60 92.7 56.7 104.5", "47.8 110.6 44.9 125.3 42 115.9 40.4 113.1 39.6 107.3 37.9 102.4 34.7 93.9 39.6 92.2 41.6 99.2 43.7 105.3"] },
  { id: "right_thigh",    pts: ["63.3 105.7 64.5 100 66.9 94.7 70.2 101.2 71 111.8 68.2 133.1 65.3 137.6 62.4 128.6 62 111.4", "71.8 113.1 73.9 124.1 73.9 140.4 72.7 145.7 66.5 138.4 70.2 133.5"] },
  { id: "left_thigh",     pts: ["34.7 98.8 37.1 108.2 37.1 127.8 34.3 137.1 31 132.7 29.4 120 28.2 111.4 29.4 100.8 32.2 94.7", "32.7 138.4 26.5 145.7 25.7 136.7 25.7 127.3 26.9 114.3 29.4 133.5"] },
  { id: "right_knee",     pts: ["65.7 140 72.2 147.8 72.2 152.2 69.8 157.1 64.9 156.7 62.9 151"] },
  { id: "left_knee",      pts: ["33.9 140 34.7 143.3 35.5 147.3 36.3 151 35.1 156.7 29.8 156.7 27.3 152.7 27.3 147.3 30.2 144.1"] },
  { id: "right_lower_leg",pts: ["71.4 160.4 73.5 153.5 76.7 161.2 79.6 167.8 78.4 187.8 79.6 195.5 74.7 195.5", "72.7 195.1 69.8 159.2 65.3 158.4 64.1 162.4 64.1 165.3 65.7 177.1"] },
  { id: "left_lower_leg", pts: ["24.9 194.7 27.8 164.9 28.2 160.4 26.1 154.3 24.9 157.6 22.4 161.6 20.8 167.8 22 188.2 20.8 195.5", "35.5 158.8"] },
  { id: "right_foot",     pts: ["69.8 195.7 71.9 195.7 73.6 198.3 71.9 213.2 70.2 219.6 67.2 202.1"] },
  { id: "left_foot",      pts: ["28.5 195.7 30.2 195.7 33.6 201.7 30.6 220 28.5 213.6 26.8 198.3"] },
];

const POST: BodyPart[] = [
  { id: "head",           pts: ["50.6 0 46 0.9 40.9 5.5 40.4 12.8 45.1 20 55.7 20 59.1 13.6 59.6 4.7 55.7 1.3"] },
  { id: "neck",           pts: ["44.7 21.7 47.7 21.7 47.2 38.3 47.7 64.7 38.3 53.2 35.3 40.9 31.1 36.6 39.1 33.2 43.8 27.2", "52.3 21.7 55.7 21.7 56.6 27.2 60.9 32.8 68.9 36.6 64.7 40.4 61.7 53.2 52.3 64.7 53.2 38.3"] },
  { id: "right_shoulder", pts: ["71.1 37 78.3 39.6 82.6 44.7 81.7 53.6 74.9 48.9 72.3 45.1"] },
  { id: "left_shoulder",  pts: ["29.4 37 23 39.1 17.4 44.3 18.3 53.6 24.3 49.4 27.2 46.4"] },
  { id: "chest",          pts: ["31.1 38.7 28.1 48.9 28.5 55.3 34 75.3 47.2 71.1 47.2 66.4 36.6 54 33.6 41.3", "68.9 38.7 71.9 49.4 71.5 56.2 66 75.3 52.8 71.1 52.8 66.4 63.4 54.5 66.4 41.7"] },
  { id: "right_upper_arm",pts: ["73.6 50.2 82.1 55.7 86 73.2 83.4 82.1 77.9 63 73.2 55.7", "72.8 58.3 77 64.7 80.4 77.4 76.6 75.3 72.8 68.9"] },
  { id: "left_upper_arm", pts: ["26.8 49.8 17.9 55.7 14.5 72.3 16.6 81.7 21.7 63.8 26.8 55.7", "26.8 58.3 26.8 68.5 23 75.3 19.1 77.4 22.6 65.5"] },
  { id: "abdomen",        pts: ["47.7 72.8 34.5 77 35.3 83.4 49.4 102.1 46.8 83", "52.3 72.8 65.5 77 64.7 83.4 50.6 102.1 53.2 83.8"] },
  { id: "right_forearm",  pts: ["86.4 75.7 91.1 83.4 93.2 94 100 106.4 96.2 104.3 88.1 89.4 84.3 83.8", "81.3 79.6 77.4 77.9 79.1 84.7 91.1 103.8 93.2 108.9 94.5 104.7"] },
  { id: "left_forearm",   pts: ["13.6 75.7 8.9 83.8 6.8 93.6 0 106.4 3.8 104.3 12.3 88.5 15.7 83", "18.7 79.6 22.1 77.9 20.9 84.3 9.4 103 6.8 108.5 5.1 104.7"] },
  { id: "hips",           pts: ["44.7 99.6 30.2 108.5 29.8 118.7 31.5 126 47.2 121.3 49.4 114.9", "55.3 99.1 51.1 114.5 52.3 120.9 68.1 126 69.8 119.1 69.4 108.5"] },
  { id: "lower_back",     pts: ["48.1 123 44.7 123 41.3 125.5 45.1 144.3 48.5 135.7 48.9 129.4", "51.9 122.6 55.7 123.4 59.1 126 54.9 144.3 51.9 136.2 51.1 129.4"] },
  { id: "right_thigh",    pts: ["71.5 121.7 69.4 128.9 63.8 126 65.5 136.6 66.4 150.2 71.1 158.3 71.5 147.7 72.8 142.1 73.6 131.9", "61.7 125.5 63.4 136.2 64.3 153.2 60 166.8 56.2 146.4"] },
  { id: "left_thigh",     pts: ["28.9 122.1 31.1 129.4 36.6 126 35.3 135.3 34.5 150.2 29.4 158.3 28.9 146.8 27.7 141.3 27.2 131.9", "38.7 125.5 44.3 145.9 40.4 166.8 36.2 152.8 37 135.3"] },
  { id: "right_knee",     pts: ["66.4 153.6 63 163 66.8 166.4 69.4 159.1"] },
  { id: "left_knee",      pts: ["34.5 153.2 31.1 159.1 33.6 166.4 37.4 162.6"] },
  { id: "right_lower_leg",pts: ["63 165.1 61.3 168.5 61.7 190.6 66.4 199.6 70.6 191.9 69 179.6 66.8 170.2", "70.6 160.4 72.3 168.5 75.7 179.1 76.6 192.8 74.5 196.6 72.3 193.6 70.6 179.6 68.1 168.1"] },
  { id: "left_lower_leg", pts: ["29.4 160.4 28.5 167.2 24.7 179.6 23.8 192.8 25.5 197 28.5 193.2 29.8 180 31.9 171.1 31.9 166.8", "37.4 165.1 35.3 167.7 33.2 171.9 31.1 180.4 30.2 191.9 34 200 38.7 190.6 39.1 168.9"] },
  { id: "right_foot",     pts: ["69.8 195.7 71.9 195.7 73.6 198.3 71.9 213.2 70.2 219.6 67.2 202.1"] },
  { id: "left_foot",      pts: ["28.5 195.7 30.2 195.7 33.6 201.7 30.6 220 28.5 213.6 26.8 198.3"] },
];

const LABELS: Record<string, string> = {
  head: "Head", neck: "Neck",
  right_shoulder: "R. Shoulder", left_shoulder: "L. Shoulder",
  chest: "Chest", abdomen: "Abdomen", lower_abdomen: "Lower Abdomen",
  right_upper_arm: "R. Upper Arm", left_upper_arm: "L. Upper Arm",
  right_forearm: "R. Forearm", left_forearm: "L. Forearm",
  hips: "Hips", lower_back: "Lower Back",
  right_thigh: "R. Thigh", left_thigh: "L. Thigh",
  right_knee: "R. Knee", left_knee: "L. Knee",
  right_lower_leg: "R. Shin/Calf", left_lower_leg: "L. Shin/Calf",
  right_foot: "R. Foot", left_foot: "L. Foot",
};
const BACK_LABELS: Record<string, string> = {
  chest: "Upper Back", abdomen: "Mid Back",
  lower_abdomen: "Lower Back", hips: "Buttocks",
};
const PART_INFO: Record<string, { top: string; bottom: string; left: string; right: string }> = {
  head:           { top: "Crown",     bottom: "Chin",    left: "Left",    right: "Right" },
  neck:           { top: "Jaw",       bottom: "Collar",  left: "L",       right: "R" },
  chest:          { top: "Collar",    bottom: "Ribs",    left: "L Side",  right: "R Side" },
  abdomen:        { top: "Ribs",      bottom: "Navel",   left: "L",       right: "R" },
  lower_abdomen:  { top: "Navel",     bottom: "Hips",    left: "L",       right: "R" },
  lower_back:     { top: "Mid Back",  bottom: "Hips",    left: "L",       right: "R" },
  hips:           { top: "Abs",       bottom: "Thighs",  left: "L",       right: "R" },
  right_shoulder: { top: "Neck",      bottom: "Arm",     left: "Front",   right: "Back" },
  left_shoulder:  { top: "Neck",      bottom: "Arm",     left: "Back",    right: "Front" },
  right_upper_arm:{ top: "Shoulder",  bottom: "Elbow",   left: "Inner",   right: "Outer" },
  left_upper_arm: { top: "Shoulder",  bottom: "Elbow",   left: "Outer",   right: "Inner" },
  right_forearm:  { top: "Elbow",     bottom: "Wrist",   left: "Inner",   right: "Outer" },
  left_forearm:   { top: "Elbow",     bottom: "Wrist",   left: "Outer",   right: "Inner" },
  right_thigh:    { top: "Hip",       bottom: "Knee",    left: "Inner",   right: "Outer" },
  left_thigh:     { top: "Hip",       bottom: "Knee",    left: "Outer",   right: "Inner" },
  right_knee:     { top: "Thigh",     bottom: "Shin",    left: "Inner",   right: "Outer" },
  left_knee:      { top: "Thigh",     bottom: "Shin",    left: "Outer",   right: "Inner" },
  right_lower_leg:{ top: "Knee",      bottom: "Ankle",   left: "Inner",   right: "Outer" },
  left_lower_leg: { top: "Knee",      bottom: "Ankle",   left: "Outer",   right: "Inner" },
  right_foot:     { top: "Heel",      bottom: "Toes",    left: "Inner",   right: "Outer" },
  left_foot:      { top: "Heel",      bottom: "Toes",    left: "Outer",   right: "Inner" },
};

export function buildHtml(
  moles: Mole[], interactive: boolean,
  primaryColor: string, bgColor: string, borderColor: string,
  gender: string = "male"
): string {
  const pinData = moles.map((m) => {
    const s = 1; // Pins identify records; they do not communicate medical risk.
    return {
      id: m.id, x: m.bodyX, y: m.bodyY, region: m.bodyRegion,
      view: m.bodyView ?? "front",
      color: CONCERN_SCORE_COLORS[s] ?? "#2d7a3a",
      name: m.customName ?? m.defaultName, score: s,
    };
  });

  // Escape HTML script terminators as well as JavaScript string syntax.
  const ANT_JSON = JSON.stringify(ANT);
  const POST_JSON = JSON.stringify(POST);
  const LABELS_JSON = JSON.stringify(LABELS);
  const BACK_LABELS_JSON = JSON.stringify(BACK_LABELS);
  const PART_INFO_JSON = JSON.stringify(PART_INFO);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:${bgColor};font-family:-apple-system,sans-serif;touch-action:none}
#overview{position:absolute;inset:0}
#svg-wrap{position:absolute;inset:0}
#detail-wrap{position:absolute;inset:0;display:none;flex-direction:column;background:${bgColor}}
#det-header{height:50px;display:flex;align-items:center;padding:0 14px;gap:10px;background:${bgColor};border-bottom:1px solid ${borderColor};flex-shrink:0}
#bb{display:flex;align-items:center;gap:4px;padding:6px 12px;border-radius:10px;background:${borderColor};border:none;cursor:pointer;font-size:13px;font-weight:600;color:${primaryColor}}
#dt{flex:1;font-size:15px;font-weight:700;color:#1a3a1a;text-align:center}
#det-svg-wrap{flex:1;overflow:hidden;display:flex;align-items:stretch}
#det-svg-wrap svg{flex:1}
#tgl{position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:5px;z-index:20;pointer-events:all}
.tr{display:flex;border-radius:9px;overflow:hidden;border:1.5px solid ${borderColor}}
.tb{padding:5px 11px;font-size:11px;font-weight:700;cursor:pointer;background:${bgColor};color:#5a8a5a;border:none;letter-spacing:0.3px}
.tb.on{background:${primaryColor};color:#fff}
#hint{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.92);border:1px solid ${borderColor};color:${primaryColor};font-size:11px;padding:5px 14px;border-radius:18px;pointer-events:none;white-space:nowrap;z-index:10}
svg.body-svg{width:100%;height:100%}
.region-hit{cursor:pointer;fill:transparent;stroke:none}
</style>
</head>
<body>
<div id="overview">
  <div id="tgl">
    <div class="tr">
      <button class="tb on" id="tb-front" onclick="setView('front')">Front</button>
      <button class="tb" id="tb-back" onclick="setView('back')">Back</button>
    </div>
  </div>
  <div id="svg-wrap"></div>
  <div id="hint">Tap a body region to add moles</div>
</div>

<div id="detail-wrap">
  <div id="det-header">
    <button id="bb" onclick="goBack()">&#8592; Body Map</button>
    <div id="dt"></div>
  </div>
  <div id="det-svg-wrap"></div>
</div>

<script>
(function(){
var PINS=${JSON.stringify(pinData).replace(/</g, "\\u003c")};
var INTERACTIVE=${interactive};
var PRIMARY='${primaryColor}';
var ANT=${ANT_JSON};
var POST=${POST_JSON};
var LABELS=${LABELS_JSON};
var BACK_LABELS=${BACK_LABELS_JSON};
var PART_INFO=${PART_INFO_JSON};

function post(d){if(typeof window.ReactNativeWebView!=='undefined')window.ReactNativeWebView.postMessage(d);else window.parent.postMessage(d,'*');}

function escapeMarkup(value){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
var bview='front',mode='overview',selPart=null;
function getBodyData(){return bview==='front'?ANT:POST;}

// ─── OVERVIEW SVG ─────────────────────────────────────────────────────────────
var SCORE_COLORS={1:'#2d7a3a',2:'#558b2f',3:'#f57c00',4:'#e64a19',5:'#b71c1c'};
function buildBodySVG(){
  var data=getBodyData();
  var moleCount={};
  var regionMaxScore={};
  PINS.forEach(function(p){
    if((p.view||'front')!==bview)return;
    moleCount[p.region]=(moleCount[p.region]||0)+1;
    var s=p.score||1;
    if(!regionMaxScore[p.region]||s>regionMaxScore[p.region])regionMaxScore[p.region]=s;
  });

  var polys='';
  data.forEach(function(part){
    part.pts.forEach(function(pts){
      polys+='<polygon points="'+pts+'" fill="hsl(122,20%,84%)" stroke="hsl(122,28%,56%)" stroke-width="0.4" stroke-linejoin="round"/>';
    });
  });

  var spine='';
  if(bview==='back'){spine='<path d="M50,22 C51,52 49,72 50,102" stroke="rgba(80,130,80,0.35)" stroke-width="0.9" fill="none" stroke-dasharray="2,2.5"/>';}

  // One hit polygon per unique part id (uses first pts only for reliable hit area)
  var hits='';var seen={};
  data.forEach(function(part){
    if(seen[part.id])return;seen[part.id]=1;
    var label=LABELS[part.id]||part.id.replace(/_/g,' ');
    if(bview==='back'&&BACK_LABELS[part.id])label=BACK_LABELS[part.id];
    // Use each pts polygon separately as hit targets for accuracy
    part.pts.forEach(function(pts,pi){
      hits+='<polygon class="region-hit" data-id="'+part.id+'" data-label="'+label+'" points="'+pts+'"/>';
    });
  });

  // region ID aliases: handle variants saved by older code
  var ALIAS={'hip':'hips','waist':'hips','pelvis':'hips','groin':'hips'};

  // Search both views so back-placed moles badge in front view too
  var allBodyData=ANT.concat(POST);

  // Helper: parse space-separated number string into [x,y,...] array
  function parseNums(s){var a=[];var t=s.trim();var w='';for(var c=0;c<=t.length;c++){var ch=t[c];if(ch===' '||ch===undefined){if(w.length){var f=parseFloat(w);if(f===f)a.push(f);w='';}else{w='';}continue;}w+=ch;}return a;}

  // Merge counts and max-scores using canonical IDs
  var normCount={};
  var normMaxScore={};
  Object.keys(moleCount).forEach(function(rid){
    var lid=ALIAS[rid]||rid;
    normCount[lid]=(normCount[lid]||0)+moleCount[rid];
    var s=regionMaxScore[rid]||1;
    if(!normMaxScore[lid]||s>normMaxScore[lid])normMaxScore[lid]=s;
  });

  var badges='';
  Object.keys(normCount).forEach(function(lid){
    var n=normCount[lid];if(!n)return;
    var found=null;
    for(var fi=0;fi<allBodyData.length;fi++){if(allBodyData[fi].id===lid){found=allBodyData[fi];break;}}
    if(!found)return;
    // Bounding-box midpoint — reliable for irregular polygon shapes
    var mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9;
    for(var pi=0;pi<found.pts.length;pi++){
      var nums=parseNums(found.pts[pi]);
      for(var ni=0;ni+1<nums.length;ni+=2){
        if(nums[ni]<mnX)mnX=nums[ni];if(nums[ni]>mxX)mxX=nums[ni];
        if(nums[ni+1]<mnY)mnY=nums[ni+1];if(nums[ni+1]>mxY)mxY=nums[ni+1];
      }
    }
    if(mnX===1e9)return;
    var cx=+((mnX+mxX)/2).toFixed(1),cy=+((mnY+mxY)/2).toFixed(1);
    // Badge color = highest concern score in this region
    var badgeColor=SCORE_COLORS[normMaxScore[lid]||1]||'#2d7a3a';
    badges+='<circle cx="'+cx+'" cy="'+cy+'" r="5.5" fill="'+badgeColor+'" stroke="white" stroke-width="0.8" pointer-events="none"/>';
    badges+='<text x="'+cx+'" y="'+cy+'" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="4.5" font-weight="bold" pointer-events="none">'+n+'</text>';
  });

  // Expanded viewBox so body occupies ~80% of the frame (more breathing room)
  return '<svg class="body-svg" viewBox="-12 -25 124 270" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><filter id="bs" x="-12%" y="-8%" width="124%" height="116%">'+
    '<feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="rgba(0,80,0,0.15)"/></filter></defs>'+
    '<g filter="url(#bs)">'+polys+'</g>'+hits+badges+spine+'</svg>';
}

function renderOverview(){
  var wrap=document.getElementById('svg-wrap');
  wrap.innerHTML=buildBodySVG();
  wrap.querySelectorAll('.region-hit').forEach(function(el){
    el.addEventListener('pointerenter',function(){el.setAttribute('fill','rgba(45,122,58,0.25)');el.setAttribute('stroke','${primaryColor}');el.setAttribute('stroke-width','0.8');});
    el.addEventListener('pointerleave',function(){el.setAttribute('fill','transparent');el.setAttribute('stroke','none');});
    el.addEventListener('click',function(){enterDetail(el.getAttribute('data-id'),el.getAttribute('data-label'));});
    el.addEventListener('touchend',function(e){e.preventDefault();enterDetail(el.getAttribute('data-id'),el.getAttribute('data-label'));},{passive:false});
  });
}

// ─── DETAIL VIEW (SVG-BASED) ──────────────────────────────────────────────────
function getPartGeo(partId){
  var data=getBodyData(),found=null;
  for(var k=0;k<data.length;k++){if(data[k].id===partId){found=data[k];break;}}
  if(!found)return null;
  var allX=[],allY=[];
  found.pts.forEach(function(pts){
    var nums=pts.trim().split(/\\s+/).map(Number);
    for(var j=0;j+1<nums.length;j+=2){allX.push(nums[j]);allY.push(nums[j+1]);}
  });
  if(!allX.length)return null;
  var minX=Math.min.apply(null,allX),maxX=Math.max.apply(null,allX);
  var minY=Math.min.apply(null,allY),maxY=Math.max.apply(null,allY);
  return{found:found,minX:minX,minY:minY,bw:Math.max(maxX-minX,1),bh:Math.max(maxY-minY,1)};
}

function renderDetailSVG(){
  if(!selPart)return;
  var geo=getPartGeo(selPart.id);
  var wrap=document.getElementById('det-svg-wrap');
  if(!geo){
    var d=getBodyData();
    var ids=d.map(function(x){return x.id;}).join(', ');
    var dbg='id="'+selPart.id+'" bview='+bview+' n='+d.length+' ids: '+ids;
    wrap.innerHTML='<div style="display:flex;flex-direction:column;align-items:flex-start;height:100%;color:#3a6a3a;font-size:13px;padding:20px;gap:8px;word-break:break-all;overflow:auto"><b>Region not available</b><span style="font-size:10px;line-height:1.5">'+escapeMarkup(dbg)+'</span></div>';
    return;
  }

  var pad=10;
  var vx=geo.minX-pad,vy=geo.minY-pad,vw=geo.bw+pad*2,vh=geo.bh+pad*2;
  var info=PART_INFO[selPart.id]||{top:'Top',bottom:'Bottom',left:'L',right:'R'};
  var fs=Math.min(vw,vh)*0.09;
  var pinR=Math.min(vw,vh)*0.07;
  var sw=Math.max(vw,vh)*0.012;

  var polys='';
  geo.found.pts.forEach(function(pts){
    polys+='<polygon points="'+pts+'" fill="url(#pg)" stroke="${primaryColor}" stroke-width="'+sw+'" stroke-linejoin="round" filter="url(#ds)"/>';
  });

  var myp=PINS.filter(function(p){return p.region===selPart.id&&(p.view||'front')===bview;});
  var pins='';
  myp.forEach(function(p){
    var sx=geo.minX+p.x*geo.bw;
    var sy=geo.minY+p.y*geo.bh;
    pins+='<g class="pin-group" data-id="'+escapeMarkup(p.id)+'" style="cursor:pointer">';
    pins+='<circle cx="'+sx+'" cy="'+sy+'" r="'+(pinR*1.6)+'" fill="rgba(255,255,255,0.5)" pointer-events="none"/>';
    pins+='<circle cx="'+sx+'" cy="'+sy+'" r="'+pinR+'" fill="'+escapeMarkup(p.color||'${primaryColor}')+'" stroke="white" stroke-width="'+(pinR*0.28)+'"/>';
    pins+='<circle cx="'+sx+'" cy="'+sy+'" r="'+(pinR*0.32)+'" fill="rgba(255,255,255,0.9)" pointer-events="none"/>';
    if(p.name){pins+='<text x="'+sx+'" y="'+(sy+pinR*1.8)+'" text-anchor="middle" dominant-baseline="middle" font-size="'+(pinR*0.8)+'" fill="#1a4a1a" pointer-events="none">'+escapeMarkup(p.name)+'</text>';}
    pins+='</g>';
  });

  var mx=geo.minX+geo.bw/2,my=geo.minY+geo.bh/2;
  var labels=
    '<text x="'+mx+'" y="'+(vy+fs*1.1)+'" text-anchor="middle" font-size="'+fs+'" fill="#3a6a3a" font-weight="bold" pointer-events="none">&#8593; '+info.top+'</text>'+
    '<text x="'+mx+'" y="'+(vy+vh-fs*0.15)+'" text-anchor="middle" font-size="'+fs+'" fill="#3a6a3a" font-weight="bold" pointer-events="none">'+info.bottom+' &#8595;</text>'+
    '<text x="'+(vx+fs*0.65)+'" y="'+my+'" text-anchor="middle" dominant-baseline="middle" font-size="'+fs+'" fill="#3a6a3a" font-weight="bold" pointer-events="none" transform="rotate(-90,'+(vx+fs*0.65)+','+my+')">'+info.left+' &#8592;</text>'+
    '<text x="'+(vx+vw-fs*0.65)+'" y="'+my+'" text-anchor="middle" dominant-baseline="middle" font-size="'+fs+'" fill="#3a6a3a" font-weight="bold" pointer-events="none" transform="rotate(90,'+(vx+vw-fs*0.65)+','+my+')">&#8594; '+info.right+'</text>';

  var hint='';
  if(INTERACTIVE&&myp.length===0){
    hint='<text x="'+mx+'" y="'+my+'" text-anchor="middle" dominant-baseline="middle" font-size="'+(fs*0.9)+'" fill="rgba(45,100,45,0.42)" pointer-events="none">Tap to mark a mole</text>';
  }
  var badge='';
  if(myp.length>0){
    badge='<text x="'+mx+'" y="'+(vy+fs*2.4)+'" text-anchor="middle" font-size="'+(fs*0.88)+'" fill="${primaryColor}" font-weight="bold" pointer-events="none">'+myp.length+' mole'+(myp.length===1?'':'s')+' recorded</text>';
  }

  var svgMarkup='<svg id="det-svg" viewBox="'+vx+' '+vy+' '+vw+' '+vh+'" '+
    'preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" '+
    'style="width:100%;height:100%;display:block;touch-action:none">'+
    '<defs>'+
    '<radialGradient id="pg" cx="50%" cy="40%" r="60%">'+
    '<stop offset="0%" stop-color="hsl(122,26%,83%)"/>'+
    '<stop offset="55%" stop-color="hsl(122,22%,73%)"/>'+
    '<stop offset="100%" stop-color="hsl(122,18%,62%)"/>'+
    '</radialGradient>'+
    '<filter id="ds" x="-15%" y="-15%" width="130%" height="130%">'+
    '<feDropShadow dx="0" dy="1" stdDeviation="1.8" flood-color="rgba(0,80,0,0.2)"/>'+
    '</filter>'+
    '</defs>'+
    polys+labels+hint+badge+pins+'</svg>';

  wrap.innerHTML=svgMarkup;

  var svgEl=document.getElementById('det-svg');
  if(!svgEl)return;

  wrap.querySelectorAll('.pin-group').forEach(function(el){
    var h=function(e){e.stopPropagation();post(JSON.stringify({type:'moleTapped',moleId:el.getAttribute('data-id')}));};
    el.addEventListener('click',h);
    el.addEventListener('touchend',function(e){e.preventDefault();h(e);},{passive:false});
  });

  function doPlace(clientX,clientY){
    if(!INTERACTIVE)return;
    var rect=svgEl.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    var svgX=vx+(clientX-rect.left)*vw/rect.width;
    var svgY=vy+(clientY-rect.top)*vh/rect.height;
    var u=Math.max(0,Math.min(1,(svgX-geo.minX)/geo.bw));
    var v=Math.max(0,Math.min(1,(svgY-geo.minY)/geo.bh));
    PINS=PINS.filter(function(p){return p.id!=='_tmp';});
    PINS.push({id:'_tmp',x:u,y:v,region:selPart.id,view:bview,color:'${primaryColor}',name:''});
    renderDetailSVG();
    post(JSON.stringify({type:'pinPlaced',x:u,y:v,z:0,normalX:0,normalY:0,normalZ:1,region:selPart.id,bodyPart:selPart.id,view:bview}));
  }

  svgEl.addEventListener('click',function(e){doPlace(e.clientX,e.clientY);});
  svgEl.addEventListener('touchend',function(e){
    e.preventDefault();
    if(e.changedTouches.length>0)doPlace(e.changedTouches[0].clientX,e.changedTouches[0].clientY);
  },{passive:false});
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function enterDetail(id,label){
  selPart={id:id,label:label};mode='detail';
  document.getElementById('overview').style.display='none';
  document.getElementById('detail-wrap').style.display='flex';
  document.getElementById('dt').textContent=label;
  renderDetailSVG();
  post(JSON.stringify({type:'bodyPartSelected',bodyPart:id,label:label}));
}
function goBack(){
  mode='overview';selPart=null;
  document.getElementById('detail-wrap').style.display='none';
  document.getElementById('overview').style.display='block';
  renderOverview();
  post(JSON.stringify({type:'goBack'}));
}
window.goBack=goBack;
function setView(v){
  bview=v;
  ['front','back'].forEach(function(k){document.getElementById('tb-'+k).className='tb'+(v===k?' on':'');});
  post(JSON.stringify({type:'viewChanged',view:v}));
  if(mode==='overview')renderOverview();
}
window.setView=setView;

window.addEventListener('message',function(e){
  if(window.parent!==window&&e.source!==window.parent)return;
  try{var msg=typeof e.data==='string'?JSON.parse(e.data):e.data;
    if(msg.type==='goBack')goBack();
    else if(msg.type==='selectPart')enterDetail(msg.bodyPart,LABELS[msg.bodyPart]||msg.bodyPart);
    else if(msg.type==='addPin'){
      PINS=PINS.filter(function(p){return p.id!=='_tmp'&&p.id!==msg.pin.id;});
      PINS.push(msg.pin);
      if(mode==='detail')renderDetailSVG();else renderOverview();
    }
    else if(msg.type==='removePin'){
      PINS=PINS.filter(function(p){return p.id!==msg.moleId;});
      if(mode==='detail')renderDetailSVG();else renderOverview();
    }
    else if(msg.type==='updatePins'){
      PINS=msg.pins;
      if(mode==='detail')renderDetailSVG();else renderOverview();
    }
  }catch(_){}
});

setView('front');
})();
</script>
</body>
</html>`;
}
