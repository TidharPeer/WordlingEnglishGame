import { useId } from 'react'
import './art.css'
export type CreatureKind='pip'|'moss'|'luma'|'dragon'|'moth'
/** Original painted sprites share the established responsive SVG frame. */
export function PaintedArt({name,size=140,happy=false,className=''}:{name:string,size?:number,happy?:boolean,className?:string}) {
 return <svg width={size} height={size} viewBox="0 0 200 200" className={`creature-art painted-creature ${happy?'creature-happy':''} ${className}`} aria-hidden="true"><image href={`/art/v2/${name}.webp`} width="200" height="200" preserveAspectRatio="xMidYMid meet"/></svg>;
}
export function Creature({kind,size=140,happy=false,className=''}:{kind:CreatureKind,size?:number,happy?:boolean,className?:string}) {
 return <PaintedArt name={kind} size={size} happy={happy} className={className}/>;
}
export function ObjectArt({kind,size=80}:{kind:string,size?:number}){
 if(['key','lantern','apple','mushroom','owl'].includes(kind))return <svg width={size} height={size} viewBox="0 0 100 100" className="object-art" aria-hidden="true"><image href={`/art/v2/${kind}.webp`} width="100" height="100" preserveAspectRatio="xMidYMid meet"/></svg>;
 if(kind==='fox')return <Creature kind="pip" size={size}/>;
 if(kind==='owl')return <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="88" rx="31" ry="5" fill="#173e35" opacity=".15"/><path d="M25 33L20 13L43 23L58 23L81 13L76 34Q91 77 67 86H34Q9 77 25 33" fill="#a78a68" stroke="#725f4c" strokeWidth="3"/><path d="M28 49Q36 35 50 48Q64 35 72 49L70 73Q50 92 30 73Z" fill="#ecdfbb"/><path d="M25 49Q13 68 28 77M75 49Q87 68 72 77" fill="#8c775a"/><circle cx="35" cy="42" r="15" fill="#f6e9c8"/><circle cx="65" cy="42" r="15" fill="#f6e9c8"/><circle cx="36" cy="43" r="7" fill="#304849"/><circle cx="64" cy="43" r="7" fill="#304849"/><circle cx="38" cy="40" r="2" fill="white"/><circle cx="66" cy="40" r="2" fill="white"/><path d="M44 50H56L50 60Z" fill="#d49c59"/><path d="M36 84L31 89M40 84V90M60 84V90M64 84L69 89" stroke="#c29757" strokeWidth="3" strokeLinecap="round"/><path d="M39 64L43 69L47 64M53 64L57 69L61 64M45 74L50 79L55 74" fill="none" stroke="#bfac87" strokeWidth="2"/></svg>;
 return <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="object-art"><ellipse cx="50" cy="87" rx="30" ry="6" fill="#163c35" opacity=".15"/>
 {(kind==='apple'||kind==='berry')&&<><path d="M50 31Q16 18 18 54Q20 90 49 82Q80 90 82 54Q84 18 50 31" fill={kind==='berry'?'#8b77b5':'#e87960'} stroke="#9b4d46" strokeWidth="3"/><path d="M50 33Q47 19 54 12" stroke="#68543e" strokeWidth="5" fill="none"/><path d="M53 25Q76 26 76 12Q58 9 53 25" fill="#76a875"/><path d="M30 43Q25 51 29 61" fill="none" stroke="#ffd6ad" strokeWidth="5" strokeLinecap="round"/></>}
 {kind==='key'&&<g fill="none" stroke="#e6bc60" strokeWidth="11" strokeLinejoin="round"><circle cx="35" cy="33" r="18"/><path d="M48 47L79 78L88 68M66 65L76 55"/></g>}
 {(kind==='leaf'||kind==='plant')&&<><path d="M49 74Q13 62 28 29Q53 29 51 58Q52 15 82 17Q86 52 52 65" fill="#a9d58a"/><path d="M50 79L51 43M50 65L35 43M52 54L71 29" stroke="#31694d" strokeWidth="3" fill="none"/>{kind==='plant'&&<path d="M29 67H74L67 89H36Z" fill="#c78361"/>}</>}
 {kind==='mushroom'&&<><path d="M41 47L35 83Q50 92 67 83L59 47" fill="#f4d9aa"/><path d="M13 51Q16 15 50 12Q84 15 88 51Q50 66 13 51" fill="#d48064" stroke="#9b5e4c" strokeWidth="3"/><g fill="#ffe1b5"><circle cx="34" cy="32" r="7"/><circle cx="66" cy="36" r="9"/><circle cx="51" cy="20" r="4"/></g></>}
 {kind==='flower'&&<><path d="M49 87V46M49 74Q24 75 25 59Q44 57 49 74" stroke="#629768" strokeWidth="6" fill="#8cba74"/>{[0,60,120,180,240,300].map(a=><ellipse key={a} cx="50" cy="25" rx="11" ry="18" fill="#edb2b0" transform={`rotate(${a} 50 42)`}/>)}<circle cx="50" cy="42" r="13" fill="#f3cf79"/></>}
 {kind==='book'&&<><path d="M17 23Q34 14 50 24Q66 14 83 23V78Q67 70 50 81Q33 70 17 78Z" fill="#e8d5a6" stroke="#8e6e52" strokeWidth="4"/><path d="M50 25V79M25 35L42 35M25 45L42 45M25 55L42 55M58 35L75 35M58 45L75 45M58 55L75 55" stroke="#ad9570" strokeWidth="2"/></>}
 {kind==='chair'&&<><path d="M25 62V18Q50 6 75 18V62M24 88V61H76V88" fill="#6f9ca7" stroke="#345c64" strokeWidth="7" strokeLinejoin="round"/><path d="M32 33H68M32 47H68" stroke="#a3c7ca" strokeWidth="4"/></>}
 {kind==='box'&&<><path d="M15 36L50 20L85 36V76L50 90L15 76Z" fill="#b67c53" stroke="#78563f" strokeWidth="3"/><path d="M15 36L50 51L85 36M50 51V90" fill="none" stroke="#78563f" strokeWidth="3"/><path d="M32 29L68 43L68 61L60 65V47L25 33" fill="#e6c38b"/></>}
 {kind==='star'&&<path d="M50 10L62 36L91 40L70 61L75 90L50 76L25 90L30 61L9 40L38 36Z" fill="#f5cd73" stroke="#c99549" strokeWidth="3"/>}
 {kind==='lantern'&&<><path d="M39 22V14Q50 1 61 14V22" stroke="#c49d66" strokeWidth="4" fill="none"/><path d="M26 30L37 20H63L74 30L66 81H34Z" fill="#e5ad58" stroke="#755647" strokeWidth="4"/><path d="M37 34H63L58 72H42Z" fill="#fff0b5"/><path d="M26 30H74M34 81H66" stroke="#755647" strokeWidth="6"/></>}
 {kind==='cushion'&&<><path d="M16 42Q50 22 84 42L89 74Q50 93 11 74Z" fill="#c18eae" stroke="#8c668e" strokeWidth="3"/><path d="M23 47Q50 34 77 47L78 69Q50 82 22 69Z" fill="#d9acc1"/><circle cx="50" cy="58" r="4" fill="#ac759d"/></>}
 {kind==='trophy'&&<><path d="M29 25H13Q10 59 37 60M71 25H87Q90 59 63 60" fill="none" stroke="#cfa65c" strokeWidth="7"/><path d="M25 15H75Q76 58 55 65V79H69V89H31V79H45V65Q24 58 25 15" fill="#eaca78"/><path d="M50 27L54 36L64 37L57 44L59 54L50 49L41 54L43 44L36 37L46 36Z" fill="#fff2c6"/></>}</svg>
}
export function ForestBackdrop({className=''}:{className?:string}){
 const id=useId().replace(/:/g,'')
 return <svg className={`forest-backdrop ${className}`} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
   <linearGradient id={`${id}sky`} x2="0" y2="1"><stop stopColor="#163b42"/><stop offset=".58" stopColor="#447c70"/><stop offset="1" stopColor="#86aa79"/></linearGradient>
   <radialGradient id={`${id}mist`}><stop stopColor="#afd5a5" stopOpacity=".55"/><stop offset="1" stopColor="#afd5a5" stopOpacity="0"/></radialGradient>
   <linearGradient id={`${id}bark`}><stop stopColor="#173f38"/><stop offset=".5" stopColor="#316548"/><stop offset="1" stopColor="#1d493d"/></linearGradient>
   <linearGradient id={`${id}hollow`} x2="0" y2="1"><stop stopColor="#102f32"/><stop offset=".7" stopColor="#1a4940"/><stop offset="1" stopColor="#306a4d"/></linearGradient>
   <linearGradient id={`${id}grass`} x2="0" y2="1"><stop stopColor="#b3cb65"/><stop offset=".22" stopColor="#7ea955"/><stop offset=".58" stopColor="#477c4e"/><stop offset="1" stopColor="#275b49"/></linearGradient>
   <linearGradient id={`${id}floor`} x2="0" y2="1"><stop stopColor="#3f7751"/><stop offset="1" stopColor="#153c39"/></linearGradient>
   <radialGradient id={`${id}sun`}><stop stopColor="#fff2af" stopOpacity=".9"/><stop offset=".42" stopColor="#f9df82" stopOpacity=".38"/><stop offset="1" stopColor="#f9df82" stopOpacity="0"/></radialGradient>
  </defs>
  <rect width="1440" height="900" fill={`url(#${id}sky)`}/>
  <ellipse cx="784" cy="248" rx="530" ry="320" fill={`url(#${id}mist)`}/>
  <path d="M365 0L469 0 642 580 572 610ZM774 0L827 0 1010 548 939 562ZM1128 0L1172 0 1302 550 1234 539Z" fill="#e7e9ae" opacity=".085"/>
  <path d="M0 420Q128 348 225 397Q332 318 444 387Q540 327 656 386Q762 289 861 367Q982 313 1087 388Q1257 294 1440 391V900H0Z" fill="#356f66" opacity=".6"/>
  <path d="M0 525Q167 441 300 510Q440 408 542 493Q675 434 751 477Q935 384 1066 488Q1229 424 1440 500V900H0Z" fill="#2d6956"/>
  <path d="M0 582Q172 503 304 558Q420 483 574 556Q693 494 776 539Q1008 464 1135 555Q1290 489 1440 570V900H0Z" fill="#235347"/>
  <path d="M126 0Q114 275 187 519Q232 428 218 194L236 0ZM340 0Q346 196 303 416L347 532Q405 287 388 0ZM1062 0Q1068 222 1023 465L1072 528Q1130 247 1113 0ZM1307 0Q1291 230 1253 493L1297 553Q1362 296 1360 0Z" fill="#224d47" opacity=".75"/>
  <path d="M396 0Q372 216 441 393Q501 462 540 503Q461 389 465 0ZM890 0Q911 233 875 364L936 455Q980 242 948 0Z" fill="#356f62" opacity=".58"/>
  <path d="M500 529Q536 390 660 300Q790 239 937 315Q1013 391 1006 526Q936 575 821 591Q650 601 500 529Z" fill="#123c39" opacity=".5"/>
  <path d="M557 535Q548 410 629 344Q718 287 846 316Q964 332 972 448L966 544Q865 575 738 570Q633 567 557 535Z" fill={`url(#${id}hollow)`}/>
  <path d="M581 524Q587 427 646 375Q718 327 819 345" fill="none" stroke="#669076" strokeWidth="12" opacity=".22" strokeLinecap="round"/>
  <path d="M984 511Q948 401 872 340Q782 261 651 301Q534 327 490 466" fill="none" stroke="#1b4d3e" strokeWidth="46" strokeLinecap="round"/>
  <path d="M1015 504Q975 374 878 314Q769 249 634 295Q535 329 481 450" fill="none" stroke="#447a4b" strokeWidth="19" strokeLinecap="round" opacity=".75"/>
  <path d="M508 453Q573 367 638 337M935 348Q886 307 844 295" fill="none" stroke="#84a55c" strokeWidth="5" opacity=".45" strokeLinecap="round"/>
  <path d="M0 667Q212 565 388 627Q488 580 598 616Q785 557 962 613Q1153 537 1440 632V900H0Z" fill={`url(#${id}floor)`}/>
  <path d="M309 674Q369 636 443 637Q557 595 642 623Q724 590 812 620Q906 591 1032 644L1057 691Q1010 718 898 731Q784 761 642 742Q509 757 399 731Q335 715 309 674Z" fill="#284f3f" opacity=".7"/>
  <path d="M296 627Q373 607 437 603Q500 562 582 590Q644 558 706 585Q784 560 853 589Q924 570 1019 609L1051 636Q1009 654 950 652Q898 680 799 673Q713 694 639 674Q564 697 492 670Q395 677 326 656Z" fill="#366d48"/>
  <path d="M307 614Q370 589 434 592Q500 551 583 579Q641 543 705 572Q783 546 853 576Q922 558 1019 597L1043 614Q984 628 948 624Q896 653 800 643Q703 661 637 645Q563 664 491 640Q397 648 326 629Z" fill={`url(#${id}grass)`}/>
  <path d="M315 611Q380 588 432 591Q490 552 570 578Q650 546 705 572Q792 547 850 576Q926 558 1014 597" fill="none" stroke="#c7da75" strokeWidth="9" opacity=".67" strokeLinecap="round"/>
  <path d="M1039 630Q1132 647 1210 705Q1292 768 1316 900H1136Q1130 800 1054 740Q1000 707 945 698Z" fill="#748d67" opacity=".65"/>
  <path d="M1054 648Q1140 677 1192 737" fill="none" stroke="#c6bc7e" strokeWidth="16" opacity=".44" strokeLinecap="round"/>
  <path d="M0 737Q206 663 353 723Q466 699 575 745Q741 716 884 748Q1145 691 1440 782V900H0Z" fill="#245447"/>
  <path d="M0 787Q150 747 266 797Q379 766 467 807Q615 768 739 823Q1022 738 1142 811Q1298 741 1440 801V900H0Z" fill="#1d4940"/>
  <g transform="translate(1128 402) scale(.8)">
   <path d="M8 77L26 206L156 211L174 77Z" fill="#796d4f" stroke="#345342" strokeWidth="7"/>
   <path d="M-12 97Q41 11 104 -8Q156 25 194 96Q106 72 -12 97Z" fill="#316342" stroke="#183f38" strokeWidth="8"/>
   <path d="M7 82Q61 26 106 7Q147 25 175 77" fill="none" stroke="#8ba55a" strokeWidth="8"/>
   <path d="M69 205V141Q96 108 123 141V207" fill="#244b43"/><path d="M79 205V143Q97 122 113 143V205" fill="#b7a374"/>
   <path d="M33 111H60V147H33ZM138 110H164V146H138Z" fill="#f3d687" stroke="#5f6047" strokeWidth="4"/>
   <path d="M46 111V147M33 129H60M151 110V146M138 129H164" stroke="#837951" strokeWidth="3"/>
   <path d="M53 211H150L164 226H42Z" fill="#908963"/>
  </g>
  <path d="M0 0H166Q155 175 190 345Q181 471 247 601L194 647L137 584L102 660L0 683ZM1451 0H1294Q1291 175 1258 365Q1288 470 1196 625L1271 646L1337 564L1373 675L1451 689Z" fill={`url(#${id}bark)`}/>
  <path d="M104 0Q116 225 84 426Q82 557 119 606M158 90Q143 296 180 467M1320 0Q1313 254 1289 417M1375 94Q1353 333 1338 542" fill="none" stroke="#79a569" opacity=".25" strokeWidth="7" strokeLinecap="round"/>
  <path d="M184 359Q310 306 373 174Q312 324 210 405ZM1261 330Q1134 301 1077 163Q1143 310 1240 384Z" fill="#255a41"/>
  <path d="M149 582Q224 615 299 600Q256 630 205 637L150 680L84 655ZM1280 582Q1182 617 1109 612Q1191 663 1262 675L1369 658Z" fill="#214c3d"/>
  <path d="M0 0H1440V86Q1325 154 1214 111Q1092 159 1001 102Q890 161 781 95Q652 156 543 100Q423 167 317 103Q176 184 0 115Z" fill="#244f3e"/>
  <path d="M0 0H305Q268 85 176 91Q82 137 0 95ZM270 0H668Q638 80 548 101Q387 123 270 75ZM806 0H1187Q1128 90 1014 108Q879 110 806 65ZM1139 0H1440V107Q1332 129 1249 77Z" fill="#356b45"/>
  <path d="M0 28Q75 0 111 31Q169 12 209 39Q259 18 291 52Q233 80 176 78Q98 99 0 72ZM369 24Q447 -6 490 33Q535 11 582 43Q615 33 664 60Q578 95 495 77Q419 99 369 61ZM905 14Q974 -13 1028 32Q1085 11 1129 42Q1183 32 1228 73Q1138 96 1069 80Q974 109 905 60ZM1286 27Q1357 -6 1440 37V83Q1364 94 1286 67Z" fill="#4d844b" opacity=".78"/>
  <path d="M279 0Q285 113 238 205M1132 0Q1100 110 1150 210" fill="none" stroke="#376846" strokeWidth="9"/>
  <g fill="#679858" opacity=".75"><path d="M247 170Q203 137 205 105Q252 105 265 157Q272 109 316 105Q310 145 274 171Z"/><path d="M1128 170Q1088 136 1096 105Q1139 111 1147 152Q1161 107 1198 114Q1190 149 1155 170Z"/><path d="M436 274Q405 253 414 224Q454 228 460 263Q469 221 499 230Q492 259 464 277Z"/><path d="M1018 300Q980 267 991 244Q1027 254 1034 289Q1044 252 1071 262Q1065 288 1039 305Z"/></g>
  <path d="M281 0Q317 127 295 257M1197 0Q1170 149 1205 267" fill="none" stroke="#6a9458" strokeWidth="3" opacity=".45"/>
  <g transform="translate(367 483)"><path d="M-31 99L-23 18L21 -7L65 21L58 103Z" fill="#688475"/><path d="M-18 96L-11 30L20 12L46 31L43 99Z" fill="#385d52"/><path d="M13 26L27 43L13 57L28 72L13 88" fill="none" stroke="#b6d4aa" strokeWidth="5" opacity=".74"/><path d="M-42 104Q7 81 73 103L72 119H-42Z" fill="#77a360"/></g>
  <g fill="#ebc47d" stroke="#645f44" strokeWidth="3"><path d="M1032 448L1042 429L1054 448L1050 471H1036Z"/><path d="M282 333L294 315L306 333L302 358H286Z"/></g>
  <circle cx="1043" cy="451" r="59" fill={`url(#${id}sun)`}/><circle cx="294" cy="335" r="62" fill={`url(#${id}sun)`}/>
  <g fill="#eff0ac" opacity=".64"><circle cx="432" cy="455" r="2"/><circle cx="586" cy="402" r="2"/><circle cx="945" cy="464" r="2"/><circle cx="1101" cy="338" r="2"/><circle cx="313" cy="268" r="2"/><circle cx="1013" cy="300" r="2"/><circle cx="703" cy="255" r="2"/></g>
  <g fill="#b9d26d" opacity=".92"><path d="M358 611Q338 597 342 578Q361 585 364 600Q369 575 385 576Q379 597 367 607Z"/><path d="M525 598Q508 575 516 555Q531 568 532 587Q545 559 557 565Q550 586 536 598Z"/><path d="M904 590Q887 574 893 556Q909 564 913 580Q918 556 932 561Q929 578 916 590Z"/><path d="M997 609Q982 586 990 572Q1006 583 1007 601Q1019 580 1033 587Q1023 605 1008 614Z"/></g>
  <g fill="#e7b17d"><circle cx="417" cy="615" r="4"/><circle cx="885" cy="605" r="3"/><circle cx="961" cy="626" r="4"/></g><g fill="#f4db93"><circle cx="424" cy="610" r="2"/><circle cx="879" cy="601" r="2"/><circle cx="966" cy="621" r="2"/></g>
  <path d="M0 797Q91 716 191 779Q253 743 309 831Q375 787 428 900H0ZM1440 774Q1336 732 1290 801Q1199 763 1154 848Q1073 818 1015 900H1440Z" fill="#143b35"/>
  <path d="M66 900Q54 817 8 784Q70 806 88 863Q101 797 143 779Q130 841 105 881Q164 839 201 856Q135 874 112 900ZM1335 900Q1333 838 1281 797Q1341 817 1355 860Q1371 807 1411 785Q1400 852 1377 883Q1411 859 1440 857V900Z" fill="#376f4d"/>
 </svg>
}



