#!/usr/bin/env node
'use strict';
// This reads and extracts the contents of an RSX-20F (FILES11)
// filesystem volume -- for example, a KL10 CPU's front-end RSX-20F
// floppy disk image file. The pathname of the disk image whose
// contents is to be extracted is named as the sole command line
// parameter. The extracted tree of directories and their files are
// created in the current working directory and a verbose listing of
// these is is displayed on the console while the program does its
// thing.
const fs = require('fs');

/*
            3.4.5  File Header Layout  - 

            Header Area 
                     +-------------------+-------------------+
            H.MPOF   |  Map Area Offset  | Ident Area Offset |   H.IDOF
                     +-------------------+-------------------+
                     |              File Number              |   H.FNUM
                     +-------------------+-------------------+
                     |         File Sequence Number          |   H.FSEQ
                     +-------------------+-------------------+
                     |         File Structure Level          |   H.FLEV
                     +-------------------+-------------------+   H.FOWN
            H.PROJ   |            File Owner UIC             |   H.PROG
                     +-------------------+-------------------+
                     |            File Protection            |   H.FPRO
                     +-------------------+-------------------+   H.FCHA
            H.SCHA   |   System Char's   |    User Char's    |   H.UCHA
                     +-------------------+-------------------+
                     |                                       |   H.UFAT
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     /       User File Attribute Area        /
                     +-                 -+-                 -+
                     |                                       |   
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+   S.HDHD

            Ident Area 
                     +-------------------+-------------------+
                     |                                       |   I.FNAM
                     +-                 -+-                 -+
                     |               File Name               |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |               File Type               |   I.FTYP
                     +-------------------+-------------------+
                     |            Version Number             |   I.FVER
                     +-------------------+-------------------+
                     |            Revision Number            |   I.RVNO
                     +-------------------+-------------------+
                     |                                       |   I.RVDT
                     +-                 -+-                 -+
                     |             Revision Date             |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-                 -+
            I.RVTI   |                   |                   |
                     +-                  +-------------------+
                     |                                       |
                     +-                 -+-                 -+
                     |             Revision Time             |
                     +-                 -+-                 -+
                     +-------------------+-                 -+
            I.CRDT   |                   |                   |
                     +-                  +-------------------+
                     |                                       |
                     +-                 -+-                 -+
                     |             Creation Date             |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |                                       |   I.CRTI
                     +-                 -+-                 -+
                     |             Creation Time             |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |                                       |   I.EXDT
                     +-                 -+-                 -+
                     |             Revision Date             |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-                 -+
                     |       Unused      |                   |
                     +-------------------+-------------------+   S.IDHD

            Map Area 
                     +-------------------+-------------------+
            M.ERVN   |   Extension RVN   | Extension Seq Num |   M.ESQN
                     +-------------------+-------------------+
                     |         Extension File Number         |   M.EFNU
                     +-------------------+-------------------+
                     |     Extension File Sequence Number    |   M.EFSQ
                     +-------------------+-------------------+
            M.LBSZ   |  LBN Field Size   | Count Field Size  |   M.CTSZ
                     +-------------------+-------------------+
            M.MAX    |  Map Words Avail. | Map Words in Use  |   M.USE
                     +-------------------+-------------------+   S.MPHD
                     |                                       |   M.RTRV
                     +-                 -+-                 -+
                     |                                       |
                     /          Retrieval Pointers           /
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |         File Header Checksum          |   H.CKSM
                     +-------------------+-------------------+

            5.1.3  Home Block Layout  - 

                     +-------------------+-------------------+
                     |        Index File Bitmap Size         |   H.IBSZ
                     +-------------------+-------------------+
                     |        Index File Bitmap LBN          |   H.IBLB
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |        Maximum Number of Files        |   H.FMAX
                     +-------------------+-------------------+
                     |     Storage Bitmap Cluster Factor     |   H.SBCL
                     +-------------------+-------------------+
                     |           Disk Device Type            |   H.DVTY
                     +-------------------+-------------------+
                     |        Volume Structure Level         |   H.VLEV
                     +-------------------+-------------------+
                     |                                       |   H.VNAM
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |              Volume Name              |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |                                       |   Unused
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |           Volume Owner UIC            |   H.VOWN
                     +-------------------+-------------------+
                     |           Volume Protection           |   H.VPRO
                     +-------------------+-------------------+
                     |        Volume Characteristics         |   H.VCHA
                     +-------------------+-------------------+
                     |        Default File Protection        |   H.DFPR
                     +-------------------+-------------------+
                     |                                       |   Unused
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
            H.FIEX   | Def. File Extend  | Def. Window Size  |   H.WISZ
                     +-------------------+-------------------+




            H.REVD   |                   |  Directory Limit  |   H.LRUC
                     +-                 -+-------------------+
                     |                                       |
                     +-                 -+-                 -+
                     |       Volume Modification Date        |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |       Volume Modification Count       |   H.REVC
                     +-------------------+-------------------+
                     |                                       |   Unused
                     +-------------------+-------------------+
                     |            First Checksum             |   H.CHK1
                     +-------------------+-------------------+
                     |                                       |   H.VDAT
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |         Volume Creation Date          | 
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |                                       |   Unused
                     +-                 -+-                 -+
                     |                                       |
                     /                  -+-                  /
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |           Pack Serial Number          |   H.PKSR
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |                                       |   Unused
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |                                       |   H.INDN
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |              Volume Name              |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |                                       |   H.INDO
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |             Volume Owner              |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |                                       |   H.INDF
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |              Format Type              |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-                 -+-                 -+
                     |                                       |
                     +-------------------+-------------------+
                     |                                       |   Unused
                     +-------------------+-------------------+
                     |            Second Checksum            |   H.CHK2
                     +-------------------+-------------------+

*/


// Define the constants we use in the FILES11 system by literally
// parsing the SYMBOL TABLE DUMP from MOUNT.LST. I substitute "_" in
// the symbol names for "." so I can refer to C.H_PROJ in JavaScript.
// I don't care about any symbols containing "$" so I don't bother
// substituting it with anything.
//
// I have made no attempt to reduce the list. Items here that I don't
// need are simply never used.
const C = `\
AC.DLK= 000002   	H.FCHA= 000014   	I.IOSB  000016   	Q.IOPR= 000007   	W.STD   000004
AC.LCK= 000001   	H.FIEX= 000055   	I.LGTH  000040   	Q.IOSB= 000010   	W.VBN   000006
A.TD  = ****** GX	H.FLEV= 000006   	I.LNK   000000   	RLB     000016R  	W.WISZ  000007
BITFNU= 000002   	H.FMAX= 000006   	I.LUN   000012   	R$$10F= 000001   	$CHAR   000052RG
CMDBFL= 001000   	H.FNUM= 000002   	I.PRI   000010   	R$$11D= 000001   	$EXT    000056RG
EX.AC1= 000001   	H.FOWN= 000010   	I.PRM   000024   	SC.BAD= 000100   	$FLAGS  000064RG
EX.AC2= 000002   	H.FPRO= 000044   	I.RTRV  000034   	SC.MDL= 000200   	$FPRO   000060RG
EX.ADF= 000010   	H.FSEQ= 000004   	I.RVDT= 000014   	SETCHA  000000R  	$LRU    000063RG
EX.ENA= 000200   	H.IBLB= 000002   	I.RVNO= 000012   	S.HDHD= 000056   	$PRO    000054RG
EX.FCO= 000004   	H.IBSZ= 000000   	I.RVTI= 000023   	S.IDHD= 000056   	$UIC    000050RG
E$$MSG= 000001   	H.IDOF= 000000   	I.RWAD= 000024   	S.MPHD= 000012   	$VNAM   000046RG
E$$TRP= 000001   	H.INDF= 000760   	I.RWAT  000026   	S.STBK= 000012   	$VNML   000044RG
FCPLUN= 000001   	H.INDN= 000730   	I.RWCT= 000026   	UC.CON= 000200   	$WIN    000062RG
FC.CEF= 020000   	H.INDO= 000744   	I.RWVB= 000032   	UC.DLK= 000100   	$$    = 000067
FC.DIR= 040000   	H.LRUC= 000056   	I.STD   000004   	UC.SWL= ****** GX	$$$ARG= 000013
FC.FCO= 010000   	H.MPOF= 000001   	I.TISZ= 000006   	U.AR  = ****** GX	$$$OST= 000014
FC.WAC= 100000   	H.PROG= 000010   	I.UIC   000022   	U.CH  = ****** GX	.ALLOC= ****** GX
FP.DEL= 000010   	H.PROJ= 000011   	LBNH  = 000040R  	U.C1  = ****** GX	.BLXI = ****** GX
FP.EXT= 000004   	H.SBCL= 000010   	LBNL  = 000042R  	U.LBH = ****** GX	.CKSM1= ****** GX
FP.RAT= 000001   	H.SCHA= 000015   	LEV11M= 000401   	U.LBN = ****** GX	.CKSUM= ****** GX
FP.RDV= 000001   	H.UCHA= 000014   	LOWFCN= 000011   	U.UI  = ****** GX	.CRFCB= ****** GX
FP.WRV= 000002   	H.UFAT= 000016   	ME.NHM= 000012   	U.VA  = ****** GX	.CRTSK= ****** GX
F$$LVL= 000001   	H.VCHA= 000042   	ME.SYN= 000007   	VC.BMW= 000002   	.DFEXT= 000005
F.DREF  000042   	H.VDAT= 000074   	ME.WRV= 000013   	VC.IFW= 000001   	.DFPRO= 164000
F.DRNM  000044   	H.VLEV= 000014   	MFDFNO= 000004   	V.FCB   000006   	.FCBAD= ****** GX
F.FEXT  000002   	H.VNAM= 000016   	MFDFSQ= 000004   	V.FFNU  000055   	.FILNO= ****** GX
F.FNUM  000006   	H.VOWN= 000036   	MO.CHA= 000002 G 	V.FIEX  000025   	.FILSQ= ****** GX
F.FOWN  000014   	H.VPRO= 000040   	MO.EXT= 000020 G 	V.FMAX  000016   	.HDBUF= ****** GX
F.FPRO  000016   	H.WISZ= 000054   	MO.FPR= 000040 G 	V.FPRO  000030   	.INWIN= ****** GX
F.FSEQ  000010   	IDXFNU= 000001   	MO.LRU= 001000 G 	V.FRBK  000034   	.IOPKT= ****** GX
F.FSQN  000013   	ID$$$ = 000222   	MO.OVR= 000200 G 	V.IBLB  000012   	.IOSTS= ****** GX
F.FVBN  000046   	IE.ABO= ****** GX	MO.PRO= 000004 G 	V.IBSZ  000013   	.MOKTB= ****** GX
F.HDLB  000022   	IE.IFC= ****** GX	MO.SWL= 000400 G 	V.IFWI  000002   	.MOPRS= ****** GX
F.LBN   000026   	IE.VER= ****** GX	MO.UIC= 000001 G 	V.LABL  000040   	.MOUNT  000066RG
F.LGTH  000052   	IO.RLB= ****** GX	MO.UNL= 000010 G 	V.LGTH  000056   	.MXQIO= ****** GX
F.LINK  000000   	IO.STC= ****** GX	MO.WIN= 000100 G 	V.LRUC  000035   	.PRFIL= 000004
F.NACS  000036   	I.ACTL  000035   	M$$HDR= 000001   	V.SBCL  000021   	.QIOST= ****** GX
F.NLCK  000037   	I.AST   000020   	M.CTSZ= 000006   	V.SBLB  000024   	.RHDFN= ****** GX
F.NWAC  000040   	I.ATL   000006   	M.EFNU= 000002   	V.SBSZ  000022   	.RHDLB= ****** GX
F.RVN   000012   	I.CRDT= 000031   	M.EFSQ= 000004   	V.STAT  000054   	.RTPTF= 001401
F.SCHA  000021   	I.CRTI= 000040   	M.ERVN= 000001   	V.STD   000004   	.SMBUF= ****** GX
F.SIZE  000032   	I.DASZ= 000007   	M.ESQN= 000000   	V.TRCT  000000   	.SMRVB= ****** GX
F.STAT  000040   	I.DPB   000011   	M.LBSZ= 000007   	V.WISZ  000020   	.SMUCB= ****** GX
F.STD   000004   	I.EFN   000013   	M.MAX = 000011   	WI.BPS= 100000   	.SMVBN= ****** GX
F.UCHA  000020   	I.EXDT= 000046   	M.RTRV= 000012   	WI.DLK= 010000   	.SYUIC= 000010
F11PR$= 000000   	I.EXTD  000030   	M.USE = 000010   	WI.EXT= 002000   	.TPARS= ****** GX
HIFCN = 000030   	I.FCN   000014   	QIOEFN= 000002   	WI.LCK= 004000   	.UCBAD= ****** GX
HOMEBL  000424R  	I.FIDP  000024   	Q.IOAE= 000012   	WI.RDV= 000400   	.VBSIZ= 001000
H.CHK1= 000072   	I.FNAM= 000000   	Q.IOEF= 000006   	WI.WRV= 001000   	.WNDOW= ****** GX
H.CHK2= 000776   	I.FNBP  000036   	Q.IOFN= 000002   	W.CTL   000000   	...GBL= 000000
H.CKSM= 000776   	I.FTYP= 000006   	Q.IOLU= 000004   	W.FCB   000002   	...TPC= 001000
H.DVTY= 000012   	I.FVER= 000010   	Q.IOPL= 000014   	W.RTRV  000012
`.split(/[\t\n]/)
      .reduce((cur, e) => {
        e = e.trimStart();
        const [id, val] = [e.slice(0, 6).replace(/\./g, '_').trim(), parseInt(e.slice(8, 14), 8)];
        if (id && Number.isInteger(val)) cur[id] = val;
        return cur;
      }, {});

const indexFID = [1, 1, 0];
const mfdFID = [4, 4, 0];

const r50ToASCII = ` ABCDEFGHIJKLMNOPQRSTUVWXYZ$.%0123456789`;

// NOTES:
//
// "DECFILE11A" is at 0x1470=5232. in the first raw disk image. this
// is H.INDF=0o760=496. This probably means there are padding bytes at
// start of image or at start of each block.
//
// At offset 0x1100 is the start of the Home Block. How is this
// possible if blocks are 512 (0x200) and the Home Block is the second
// block in the Index File? 0x1100 isn't even a multiple of 512.

const buf = fs.readFileSync(process.argv[2]);
const homeBlock = buf.slice(0x1100); // Dunno why this offset

console.log(`Volume Home Block:
Index File Bitmap Size:            ${w16(homeBlock, C.H_IBSZ)}
Index File BitMap LBN:             0x${w32(homeBlock, C.H_IBLB).toString(16)}
Maximum Number of Files:           ${w16(homeBlock, C.H_FMAX)}
Storage Bitmap Cluster Factor:     ${w16(homeBlock, C.H_SBCL)}
Disk Device Type:                  ${w16(homeBlock, C.H_DVTY)}
Volume Structure Level:            0o${w16(homeBlock, C.H_VLEV).toString(8)}
Volume Name:                       ${homeBlock.toString('UTF-8', C.H_VNAM, C.H_VNAM + 12)}
Owner UIC:                         [${uic(homeBlock, C.H_VOWN)}]
Volume Characteristics:            0x${w16(homeBlock, C.H_VCHA).toString(16)}
First Checksum:                    0x${w16(homeBlock, C.H_CHK1).toString(16)}
Volume Creation Date:              ${homeBlock.toString('UTF-8', C.H_VDAT, C.H_VDAT + 14)}
Volume Name:                       ${homeBlock.toString('UTF-8', C.H_INDN, C.H_INDN + 12)}
Second Checksum:                   0x${w16(homeBlock, C.H_CHK2).toString(16)}
`);


if ('testing' == 'not-testing') {
  console.log(`R50 [1683,6606]=${fromR50([1683, 6606])}`);
  console.log(`R50 for 'ABCDEF=${toR50('ABCDEF')}`);
}


function w16(buf, offset) {
  return buf.readUInt16LE(offset);
}


function w32(buf, offset) {
  return (buf.readUInt16LE(offset) << 16) | buf.readUInt16LE(offset+2);
}


function uic(buf, offset) {
  return [buf.readUInt8(offset+1), buf.readUInt8(offset)];
}


function r50Byte(w, pos) {
  const div = Math.pow(40, pos);
  const cx = Math.floor(w / div) % 40;
  return r50ToASCII.charAt(cx);
}


// From the specified array of little-endian PDP-11 words in
// RADIX-50 format (three characters per word) into an ASCII string
// and return it.
function fromR50(words) {
  return words.reduce((cur, w) => cur + r50Byte(w, 2) + r50Byte(w, 1) + r50Byte(w, 0), "").trim();
}


// From the specified string return the little-endian PDP-11 words to
// encode the string in RADIX-50 format. The string is padded on the
// end to a multiple of three bytes.
function toR50(str) {
  return str.padEnd(Math.floor((str.length + 2) / 3) * 3)
    .match(/.{3}/g)
    .map(s =>
         r50ToASCII.indexOf(s.charAt(0)) * 40 * 40 +
         r50ToASCII.indexOf(s.charAt(1)) * 40 +
         r50ToASCII.indexOf(s.charAt(2)));
}
