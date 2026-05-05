(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,735069,e=>{"use strict";var r=e.i(168911);e.s(["Plus",()=>r.default])},127249,204695,e=>{"use strict";var r=e.i(937601);e.i(740876);let t={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};var a=e.i(796553);e.i(103466);let l={map:"maps",mod:"mods"};function o(e){return l[e]}e.s(["ASSET_TYPES",0,["mod","map"],"assetTypeToListingPath",0,o],204695);var i=e.i(612979),n=e.i(104165),s=e.i(528693),c=e.i(368328),d=e.i(600934),u=e.i(899066);e.s(["ItemCard",0,function({type:e,item:l,installedVersion:m,totalDownloads:p,viewMode:b="full",descriptionMode:g="raw"}){let h="city_code"in l,f=h?l:null,y=f?(0,c.getCountryFlagIcon)(f.country):null,x=(0,n.usePathname)(),w=(0,n.useSearchParams)(),v=(0,s.useMemo)(()=>{if("preview"===g)return e=>{var r;return(r=e)?r.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<!--([\s\S]*?)-->/g," ").replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi,"\n").replace(/<li[^>]*>/gi,"- ").replace(/<[^>]+>/g," ").replace(/```[\s\S]*?```/g," ").replace(/`([^`]+)`/g,"$1").replace(/!\[([^\]]*)\]\([^)]*\)/g,"$1").replace(/\[([^\]]+)\]\([^)]*\)/g,"$1").replace(/^\s{0,3}#{1,6}\s+/gm,"").replace(/^\s{0,3}>\s?/gm,"").replace(/^\s*([-*+]|\d+\.)\s+/gm,"").replace(/\*\*|__|\*|_|~~/g,"").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(e,r)=>{let a=String(r).toLowerCase();if(a.startsWith("#x")){let r=Number.parseInt(a.slice(2),16);return Number.isFinite(r)?String.fromCodePoint(r):e}if(a.startsWith("#")){let r=Number.parseInt(a.slice(1),10);return Number.isFinite(r)?String.fromCodePoint(r):e}return t[a]??e}).replace(/\s+/g," ").trim():""}},[g]),k=w.toString()?`${x}?${w.toString()}`:x,j=`/railyard/${o(e)}/${l.id}?from=${encodeURIComponent(k)}`;return(0,r.jsx)(a.ItemCard,{type:"map"===e?"map":"mod",id:l.id,name:l.name,author:{author_alias:l.author,contributor_tier:void 0},gallery:l.gallery,description:l.description,city_code:f?.city_code,country:f?.country,countryFlag:y?(0,r.jsx)(y,{className:"h-3.5 w-5 rounded-[1px]"}):void 0,location:f?.location,source_quality:f?.source_quality,level_of_detail:f?.level_of_detail,special_demand:f?.special_demand,tags:h?void 0:l.tags,population:f?.population,installedVersion:m,totalDownloads:p,viewMode:b,href:j,imagePath:l.gallery?.[0],formatDescription:v,renderImage:({type:e,id:t,imagePath:a,className:l})=>(0,r.jsx)(u.GalleryImage,{type:"mod"===e?"mods":"maps",id:t,imagePath:a,className:l}),renderLink:({href:e,children:t})=>(0,r.jsx)(i.default,{href:e,className:"block w-full",children:t}),renderAuthorName:()=>(0,r.jsx)(d.AuthorName,{author:l,className:"min-w-0 max-w-full",nameClassName:"truncate"})})}],127249)},383065,e=>{"use strict";var r=e.i(937601),t=e.i(528693),a=e.i(883469),l=e.i(583074),l=l,o=e.i(735069),i=e.i(242092),n=e.i(127249),s=e.i(798437);let c="maplibre-gl-script",d={light:{roads:"#DCDCDC",buildings:"#DDDDDD",water:"#9FC9EA",background:"#F2E7D3",parks:"#A9D8B6",airports:"#F0F1F5",runways:"#DFE2E7",roadLabel:"#807F7A",roadLabelHalo:"#FFFFFF",neighborhoodLabel:"#9CA3AF",neighborhoodLabelHalo:"#FFFFFF",cityLabel:"#5D6066",cityLabelHalo:"#FFFFFF"},dark:{roads:"#4A4A4A",buildings:"#454957",water:"#062036",background:"#0F1A24",parks:"#0B1715",airports:"#181C28",runways:"#242938",roadLabel:"#6E6E6E",roadLabelHalo:"#000000",neighborhoodLabel:"#6B7280",neighborhoodLabelHalo:"#000000",cityLabel:"#AFB3BA",cityLabelHalo:"#000000"}};function u(e,r,t){return Math.min(Math.max(e,r),t)}function m(e){let r=e.map(e=>({x:e.x,y:e.y,maps:[...e.maps]})),t=!0;for(;t;){t=!1;e:for(let e=0;e<r.length;e+=1)for(let a=e+1;a<r.length;a+=1){if(!function(e,r,t=4){let a=e.x-16,l=e.x+16,o=e.y-32,i=e.y,n=r.x-16,s=r.x+16,c=r.y-32,d=r.y;return!(l+t<n||s+t<a||i+t<c||d+t<o)}({id:"",map:r[e].maps[0],x:r[e].x,y:r[e].y,maps:r[e].maps,clusterSize:r[e].maps.length,isRepresentative:!0},{id:"",map:r[a].maps[0],x:r[a].x,y:r[a].y,maps:r[a].maps,clusterSize:r[a].maps.length,isRepresentative:!0}))continue;let l=[...r[e].maps,...r[a].maps],o=l.length;r[e]={x:(r[e].x*r[e].maps.length+r[a].x*r[a].maps.length)/o,y:(r[e].y*r[e].maps.length+r[a].y*r[a].maps.length)/o,maps:l},r.splice(a,1),t=!0;break e}}return r.map(e=>{let r=new Map;for(let t of e.maps)r.set(t.id,t);let t=[...r.values()].sort((e,r)=>e.id.localeCompare(r.id)),a=t.length;return{id:t.map(e=>e.id).join("|"),map:t[0],x:e.x,y:e.y,maps:t,clusterSize:a,isRepresentative:!0}})}function p({clusterSize:e,animate:t}){let l=e>1,o=function(e){if(e)return{animation:"marker-split-join 240ms cubic-bezier(0.22, 0.9, 0.35, 1)"}}(t);return l?(0,r.jsxs)("span",{className:"relative inline-flex items-center justify-center rounded-md border border-[var(--suite-secondary-light)] bg-[var(--suite-secondary-light)] text-[var(--suite-text-light)] shadow-sm dark:border-[var(--suite-secondary-dark)] dark:bg-[var(--suite-secondary-dark)] dark:text-[var(--suite-text-dark)]",style:{width:32,height:32,...o},"aria-hidden":"true",children:[(0,r.jsx)(a.MapPin,{className:"size-4",strokeWidth:2.2}),(0,r.jsx)("sup",{className:"absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-[var(--suite-accent-light)] px-1 text-[11px] font-black leading-none text-[var(--suite-text-inverted-light)] shadow-[0_0_0_1px_rgba(0,0,0,0.28)] dark:border-background dark:bg-[var(--suite-accent-dark)] dark:text-[var(--suite-text-inverted-dark)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.22)]",children:e})]}):(0,r.jsx)("span",{className:"inline-flex items-center justify-center text-[var(--suite-accent-light)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)] dark:text-[var(--suite-accent-dark)]",style:{width:32,height:32,...o,lineHeight:1},"aria-hidden":"true",children:(0,r.jsx)(a.MapPin,{className:"size-5",strokeWidth:2.25})})}async function b(e){let r=await fetch("https://tiles.openfreemap.org/styles/liberty");if(!r.ok)throw Error(`Failed to fetch base map style (${r.status})`);let t=await r.json(),a=d[e],l=t.layers.filter(e=>{let r=String(e.id??"").toLowerCase();if("natural_earth"===r||r.includes("graticule")||r.includes("equator")||r.includes("tropic")||r.includes("latitude")||r.includes("longitude"))return!1;if("symbol"===String(e.type??"")){let t=e.layout,a=!!t?.["text-field"],l=!!t?.["icon-image"];if(!a||l||r.includes("shield"))return!1}return!0}).map(e=>{let r={...e},t=e.layout,l=e.paint;t&&(r.layout={...t}),l&&(r.paint={...l});let o=String(e.id??"").toLowerCase(),i=String(e.type??""),n=r.layout,s=r.paint;if("symbol"===i&&n?.["text-field"]&&(n["text-field"]=["coalesce",["get","name_en"],["get","name:en"],["get","name_int"],["get","name"]]),!s)return r;if("background"===i&&(s["background-color"]=a.background),"fill"===i)if("fill-pattern"in s&&delete s["fill-pattern"],o.includes("water"))s["fill-color"]=a.water,s["fill-outline-color"]=a.water;else if(o.includes("ice"))s["fill-color"]=a.buildings,s["fill-outline-color"]=a.buildings;else if("building"===o||o.includes("building-3d"))s["fill-color"]=a.buildings,s["fill-outline-color"]=a.buildings;else if(o.includes("aeroway")){let e=o.includes("runway")?a.runways:a.airports;s["fill-color"]=e,s["fill-outline-color"]=e}else o.includes("park")||o.includes("green")||o.includes("landcover_wood")||o.includes("landcover_grass")||o.includes("landcover_wetland")?(s["fill-color"]=a.parks,s["fill-outline-color"]=a.parks):(o.includes("natural_earth")||o.includes("landuse")||o.includes("landcover"))&&(s["fill-color"]=a.background,s["fill-outline-color"]=a.background);if("line"===i&&(o.includes("water")?s["line-color"]=a.water:"park_outline"===o?(s["line-color"]=a.parks,s["line-opacity"]=.25):o.includes("aeroway_runway")||o.includes("aeroway_taxiway")?s["line-color"]=a.runways:o.includes("aeroway")?s["line-color"]=a.airports:o.includes("road")||o.includes("street")||o.includes("highway")||o.includes("motorway")||o.includes("bridge_")||o.includes("tunnel_")?s["line-color"]=a.roads:o.includes("boundary")&&(s["line-color"]=a.neighborhoodLabel)),"symbol"===i){let e=o.includes("highway-name")||o.includes("road_shield")?{text:a.roadLabel,halo:a.roadLabelHalo}:o.includes("city")||o.includes("country")||o.includes("state")?{text:a.cityLabel,halo:a.cityLabelHalo}:{text:a.neighborhoodLabel,halo:a.neighborhoodLabelHalo};s["text-color"]=e.text,s["text-halo-color"]=e.halo,s["text-halo-width"]=1.8}return r});return{...t,layers:l}}e.s(["WorldMap",0,function(){let e=(0,t.useRef)(null),a=(0,t.useRef)(null),d=(0,t.useRef)(null),g=(0,t.useRef)(null),h=(0,t.useRef)(null),f=(0,t.useRef)(!0),{resolvedTheme:y}=(0,i.useTheme)(),{maps:x,mapDownloadTotals:w}=(0,s.useRegistry)(),v="light"===y||"dark"===y?y:"light",[k,j]=(0,t.useState)(!1),[F,_]=(0,t.useState)(!0),[N,M]=(0,t.useState)([]),[z,S]=(0,t.useState)(null),[L,C]=(0,t.useState)(0),[E,P]=(0,t.useState)(!1),[R,I]=(0,t.useState)({width:0,height:0}),A=(0,t.useMemo)(()=>x.map(e=>({map:e,coordinates:function(e){let r=e.initial_view_state??e.initialViewState;if(!r)return null;let t=Number(r.latitude),a=Number(r.longitude);return!Number.isFinite(t)||!Number.isFinite(a)||t<-90||t>90||a<-180||a>180?null:[a,t]}(e)})).filter(e=>null!==e.coordinates).map(e=>({id:e.map.id,map:e.map,coordinates:e.coordinates})),[x]),T=(0,t.useMemo)(()=>(function(e){let r=e.map(e=>{var r,t;let a,l,o=(r=e.coordinates[0],t=e.coordinates[1],{x:(r+180)/360*(a=512*5.278031643091577),y:(.5-Math.log((1+(l=Math.sin(Math.max(-85.05112878,Math.min(85.05112878,t))*Math.PI/180)))/(1-l))/(4*Math.PI))*a});return{point:e,x:o.x,y:o.y}}),t=[];for(let e of r){let r=null,a=1/0;for(let l of t){let t=Math.hypot(e.x-l.x,e.y-l.y);t<=96&&t<a&&(r=l,a=t)}if(!r){t.push({x:e.x,y:e.y,members:[e.point]});continue}r.members.push(e.point);let l=r.members.length;r.x=(r.x*(l-1)+e.x)/l,r.y=(r.y*(l-1)+e.y)/l}return t.map(e=>{let r,t=[...e.members].sort((e,r)=>e.id.localeCompare(r.id)),a=t.map(e=>e.id);return{id:a.join("|"),maps:t.map(e=>e.map),mapIds:a,representativeId:t[0].id,anchor:[(r=t.reduce((e,r)=>(e.lng+=r.coordinates[0],e.lat+=r.coordinates[1],e),{lng:0,lat:0})).lng/t.length,r.lat/t.length]}})})(A),[A]),$=(0,t.useMemo)(()=>{let e=new Map;for(let r of T)for(let t of r.mapIds)e.set(t,{clusterSize:r.mapIds.length,maps:r.maps,representativeId:r.representativeId,anchor:r.anchor});return e},[T]);(0,t.useEffect)(()=>{if(!e.current)return;let r=null,t=!1,l=null;return(async()=>{try{let o=await (window.maplibregl?Promise.resolve(window.maplibregl):new Promise((e,r)=>{let t=document.getElementById(c);if(t){t.addEventListener("load",()=>{window.maplibregl&&e(window.maplibregl)}),t.addEventListener("error",()=>r(Error("Failed to load MapLibre script")));return}let a=document.createElement("script");a.id=c,a.src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js",a.async=!0,a.onload=()=>{window.maplibregl?e(window.maplibregl):r(Error("MapLibre script loaded but window.maplibregl is missing"))},a.onerror=()=>r(Error("Failed to load MapLibre script")),document.head.appendChild(a)})),i=await b(v);if(t||!e.current)return;r=new o.Map({container:e.current,style:i,center:[0,20],zoom:1.2,minZoom:.6,maxZoom:18,attributionControl:!0,dragRotate:!1,pitchWithRotate:!1,touchPitch:!1,renderWorldCopies:!1}),r.dragPan?.enable?.(),r.touchZoomRotate?.enable?.(),r.touchZoomRotate?.disableRotation?.(),r.scrollZoom?.enable?.(),r.doubleClickZoom?.enable?.(),r.boxZoom?.enable?.(),r.keyboard?.enable?.(),a.current=r,l=()=>{if(t)return;j(!0);let e=Number(r?.getZoom?.());if(Number.isFinite(e)){let r=e<5.15;f.current=r,_(r)}},r.on("load",l),r.isStyleLoaded?.()&&l()}catch(e){console.error("Failed to initialize MapLibre world map:",e)}})(),()=>{t=!0,j(!1),M([]),S(null),C(0),null!==d.current&&(window.clearTimeout(d.current),d.current=null),null!==g.current&&(window.cancelAnimationFrame(g.current),g.current=null),null!==h.current&&(window.clearTimeout(h.current),h.current=null),r&&l&&r.off("load",l),a.current=null,r?.remove()}},[v]),(0,t.useEffect)(()=>{let r=a.current,t=e.current;if(!k||!r||!t)return;let l=()=>{g.current=null;let e=Number(r.getZoom?.()),a=Number.isFinite(e)?e:1.2,l=f.current?a<5.15:a<=4.7;l!==f.current&&(f.current=l,_(l),P(!0),null!==h.current&&window.clearTimeout(h.current),h.current=window.setTimeout(()=>{P(!1),h.current=null},230));let o=t.clientWidth,i=t.clientHeight;I(e=>e.width===o&&e.height===i?e:{width:o,height:i});let n=[];for(let e of A){let t=$.get(e.id);if(!t)continue;let a=l?t.anchor:e.coordinates,s=r.project(a);s.x<-48||s.y<-48||s.x>o+48||s.y>i+48||n.push({id:e.id,map:e.map,x:s.x,y:s.y,maps:l?t.maps:[e.map],clusterSize:l?t.clusterSize:1,isRepresentative:t.representativeId===e.id})}M(n)},o=()=>{null===g.current&&(g.current=window.requestAnimationFrame(l))};return o(),r.on("render",o),r.on("move",o),r.on("zoom",o),r.on("resize",o),()=>{null!==g.current&&(window.cancelAnimationFrame(g.current),g.current=null),null!==h.current&&(window.clearTimeout(h.current),h.current=null),r.off("render",o),r.off("move",o),r.off("zoom",o),r.off("resize",o)}},[$,A,k]);let D=(0,t.useMemo)(()=>m(N.filter(e=>!F||e.isRepresentative)).find(e=>e.id===z)??null,[F,z,N]),H=(0,t.useMemo)(()=>m(N.filter(e=>!F||e.isRepresentative)),[F,N]),W=D?.maps??[],Z=W.length>0?W[(L%W.length+W.length)%W.length]:null,B=u(Math.round(.42*R.height),184,300),q=u(R.width-24,200,352),O=(0,t.useMemo)(()=>{if(!D)return{left:12,top:12};let e=D.x-16,r=D.x+16,t=D.y-32,a=D.y,l=Math.max(12,R.width-12-q),o=Math.max(12,R.height-12-B),i=[{left:r+14,top:t-B-14},{left:r+14,top:a+14},{left:e-q-14,top:t-B-14},{left:e-q-14,top:a+14}],n=i.find(e=>{let r=e.left+q,t=e.top+B;return e.left>=12&&e.top>=12&&r<=R.width-12&&t<=R.height-12});if(n)return n;let s=i[0];return{left:u(s.left,12,l),top:u(s.top,12,o)}},[B,q,D,R.height,R.width]),U=()=>{null!==d.current&&window.clearTimeout(d.current),d.current=window.setTimeout(()=>{S(null),C(0),d.current=null},180)},K=()=>{null!==d.current&&(window.clearTimeout(d.current),d.current=null)};return(0,r.jsxs)("div",{className:"railyard-world-map relative h-full w-full",children:[(0,r.jsx)("style",{children:`
        @keyframes marker-split-join {
          0% {
            transform: scale(0.82);
            opacity: 0.55;
          }
          62% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .railyard-world-map .maplibregl-ctrl-attrib.maplibregl-compact {
          border: 1px solid color-mix(in oklab, var(--color-border) 80%, transparent);
          border-radius: 9999px;
          background: color-mix(in oklab, var(--color-card) 88%, transparent);
          color: var(--color-foreground);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(4px);
          display: inline-flex;
          align-items: center;
        }

        .railyard-world-map .maplibregl-ctrl-attrib.maplibregl-compact a {
          color: color-mix(in oklab, var(--suite-accent-light) 84%, var(--color-foreground) 16%);
        }

        .railyard-world-map .maplibregl-ctrl-attrib-button {
          order: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin-left: 6px;
          margin-right: -18px;
          vertical-align: middle;
          float: none;
          border-radius: 9999px;
          border: 1px solid color-mix(in oklab, var(--color-border) 78%, transparent);
          background-color: var(--color-background);
          color: var(--color-foreground);
          background-image: none !important;
          opacity: 1;
          -webkit-tap-highlight-color: transparent;
          outline: none !important;
          box-shadow: none !important;
          position: relative;
        }

        .railyard-world-map .maplibregl-ctrl-attrib-button::before {
          content: "i";
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: var(--color-foreground);
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
        }

        .railyard-world-map .maplibregl-ctrl-attrib-button:focus,
        .railyard-world-map .maplibregl-ctrl-attrib-button:focus-visible,
        .railyard-world-map .maplibregl-ctrl-attrib-button:active,
        .railyard-world-map .maplibregl-ctrl-attrib.maplibregl-compact:focus-within {
          outline: none !important;
          box-shadow: none !important;
          border-color: color-mix(in oklab, var(--color-border) 82%, transparent) !important;
        }

        .dark .railyard-world-map .maplibregl-ctrl-attrib.maplibregl-compact {
          background: color-mix(in oklab, var(--color-card) 82%, black 18%);
          border-color: color-mix(in oklab, var(--color-border) 70%, black 30%);
          color: color-mix(in oklab, var(--color-foreground) 82%, white 18%);
        }

        .dark .railyard-world-map .maplibregl-ctrl-attrib.maplibregl-compact a {
          color: color-mix(in oklab, var(--suite-accent-dark) 78%, white 22%);
        }

        .dark .railyard-world-map .maplibregl-ctrl-attrib-button {
          background-color: var(--color-background);
          color: var(--color-foreground);
          border-color: color-mix(in oklab, var(--color-border) 78%, transparent);
          filter: none;
          opacity: 1;
        }

        .railyard-world-map .maplibregl-canvas-container,
        .railyard-world-map .maplibregl-canvas {
          touch-action: none;
        }

        .railyard-world-map .maplibregl-canvas-container.maplibregl-interactive {
          cursor: grab;
        }

        .railyard-world-map .maplibregl-canvas-container.maplibregl-interactive:active {
          cursor: grabbing;
        }

        .railyard-world-map .maplibregl-control-container {
          z-index: 40;
        }

        .railyard-world-map .maplibregl-ctrl-bottom-left,
        .railyard-world-map .maplibregl-ctrl-bottom-right,
        .railyard-world-map .maplibregl-ctrl-top-left,
        .railyard-world-map .maplibregl-ctrl-top-right {
          z-index: 40;
        }
      `}),(0,r.jsx)("div",{ref:e,className:"h-full w-full rounded-none","aria-label":"World map"}),(0,r.jsxs)("div",{className:"pointer-events-none absolute right-2 top-2 z-20 flex flex-col gap-1.5 sm:right-3 sm:top-3 sm:gap-2",children:[(0,r.jsx)("button",{type:"button",onClick:()=>a.current?.zoomIn?.({duration:220}),className:"pointer-events-auto inline-flex size-8 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent dark:bg-card/90 sm:size-9","aria-label":"Zoom in",children:(0,r.jsx)(o.Plus,{className:"size-3.5 sm:size-4",strokeWidth:2.3})}),(0,r.jsx)("button",{type:"button",onClick:()=>a.current?.zoomOut?.({duration:220}),className:"pointer-events-auto inline-flex size-8 items-center justify-center rounded-md border border-border bg-card/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-accent dark:bg-card/90 sm:size-9","aria-label":"Zoom out",children:(0,r.jsx)(l.default,{className:"size-3.5 sm:size-4",strokeWidth:2.3})})]}),(0,r.jsx)("div",{className:"pointer-events-none absolute inset-0 z-10 overflow-hidden",children:H.map(e=>{let t=z===e.id;return(0,r.jsx)("button",{type:"button",className:E?"absolute transform-gpu transition-[left,top,opacity,transform] duration-230 ease-out":"absolute transform-gpu transition-opacity duration-120 ease-out",style:{left:`${e.x}px`,top:`${e.y}px`,transform:"translate(-50%, -100%)",opacity:1,pointerEvents:"auto",zIndex:t?2:1},onMouseEnter:()=>{K(),S(e.id),C(0)},onMouseLeave:U,onFocus:()=>{K(),S(e.id),C(0)},onBlur:U,onClick:()=>{1===e.maps.length&&(window.location.href=`/railyard/maps/${e.maps[0].id}`)},"aria-label":1===e.maps.length?`Open ${e.maps[0].name}`:`Cluster of ${e.maps.length} maps`,children:(0,r.jsx)("span",{className:E?"scale-[0.94] opacity-90 transition-[transform,opacity] duration-200":t?"scale-105 transition-transform duration-150":"scale-100 transition-transform duration-150",children:(0,r.jsx)(p,{clusterSize:e.clusterSize,animate:E})})},e.id)})}),D&&Z?(0,r.jsx)("div",{className:"pointer-events-none absolute z-20",style:{left:`${O.left}px`,top:`${O.top}px`,width:`${q}px`,maxHeight:"calc(100% - 24px)"},children:(0,r.jsxs)("div",{className:"pointer-events-auto h-full overflow-auto rounded-xl border border-border/60 bg-card/95 p-2 shadow-xl backdrop-blur-sm",onMouseEnter:K,onMouseLeave:U,children:[(0,r.jsx)(n.ItemCard,{type:"map",item:Z,viewMode:"compact",totalDownloads:w[Z.id]??0}),W.length>1?(0,r.jsxs)("div",{className:"mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground",children:[(0,r.jsx)("button",{type:"button",onClick:()=>{C(e=>(e-1+W.length)%W.length)},className:"rounded-md border border-border bg-background/70 px-2 py-1 hover:bg-accent",children:"Prev"}),(0,r.jsxs)("span",{children:[L%W.length+1," / ",W.length]}),(0,r.jsx)("button",{type:"button",onClick:()=>{C(e=>(e+1)%W.length)},className:"rounded-md border border-border bg-background/70 px-2 py-1 hover:bg-accent",children:"Next"})]}):null]})}):null]})}],383065)}]);