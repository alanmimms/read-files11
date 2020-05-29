#!/usr/bin/env node
'use strict';
// This reads and extracts the contents of an RSX-20F (FILES11) RX-01
// MEDIA ONLY filesystem volume -- for example, a KL10 CPU's front-end
// RSX-20F RX01 floppy disk image file. The pathname of the disk image
// whose contents is to be extracted is named as the sole command line
// parameter. The extracted tree of directories and their files are
// created in the current working directory and a verbose listing of
// these is is displayed on the console while the program does its
// thing.
//
// The reason this will only work on RX01 media image files is that
// this implements the RX01 logical block to physical sector mapping
// that is, well, _strange_ for RX01. This was done for good
// performance reasons in the original RX01 design, but here in the
// 21st Century it's wierd as fuck.
const _ = require('lodash');
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
// parsing the SYMBOL TABLE DUMP from MOUNT.LST. I don't care about
// any symbols containing "$" so I don't bother substituting it with
// anything.
//
// If an element name is of the form x.yyy and we have a prefixes
// entry named `x` then add `yyy` to that prefix object. When this is
// done we can refer to x.yyy in our JavaScript code and it will "just
// work".
//
// I have made no attempt to reduce the list. Items here that I don't
// need are simply never used.
const F = {};
const H = {};
const I = {};
const S = {};
const prefixes = {F, H, I, S};
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
        const [id, val] = [e.slice(0, 6).trim(), parseInt(e.slice(8, 14), 8)];

        if (id && Number.isInteger(val)) {
          cur[id] = val;
          const dotPos = id.indexOf('.');

          if (dotPos > 0) {
            const prefix = id.slice(0, dotPos);
            const postfix = id.slice(dotPos + 1);

            if (prefix && prefixes[prefix] && postfix) {
              prefixes[prefix][postfix] = val;
            }
          }
        }

        return cur;
      }, {});

const indexFID = [1, 1, 0];
const mfdFID = [4, 4, 0];

const r50ToASCII = ` ABCDEFGHIJKLMNOPQRSTUVWXYZ$.%0123456789`;

// Edited for clarity from
// (http://gunkies.org/wiki/RX0x_floppy_drive)[RX0x floppy drive - Computer History Wiki].
//
// RX01 DRIVE
//     Total Surfaces:      1
//     Tracks Per Surface: 77 (76 used)
//     Sectors Per Track:  26
//
// DEC normally left track 0 unused (although it was not used to hold
// bootstraps). This was because the standard IBM format reserved
// track 0 for special purposes.
//
// They also used an idiosyncratic layout of the 'logical' sectors on
// a floppy, intended to maximize the performance: the first logical
// sector of each data track was offset by six 'physical' sectors from
// the 'first' sector of the preceding track, and sequential logical
// sectors were on alternating physical sectors.
const nTracks = 76;             // Ignore track #0
const sectorsPerTrack = 26;
const sectorSize = 128;
const blockSize = 512;
const sectorsPerBlock = blockSize / sectorSize;
const trackSize = sectorSize * sectorsPerTrack;
const nBlocks = nTracks * trackSize / blockSize;

// Read the RX01 media image in so we can swizzle it.
const rawBuf = fs.readFileSync(process.argv[2]);

// Convert rawBuf RX01 media sector-mapped the RX01 way to buf so we
// can view it as a sequence of logical 512B blocks as required by
// FILES-11 structure.
const buf = convertToLogicalBlocks(rawBuf);

const homeBlockOffset = 0x800;
const homeBlock = buf.slice(homeBlockOffset);

const indexBitmapOffset = homeBlockOffset + 0o1000;
const indexBitmap = buf.slice(indexBitmapOffset);

const fileHeadersOffset = indexBitmapOffset + 0o1000 * w16(homeBlock, H.IBSZ);
const fileHeaders = buf.slice(fileHeadersOffset);

console.log(`buf.length=0x${buf.length.toString(16)}`);

const bpl = 16;

const dump = _.range(0, Math.min(1024*1024, buf.length), bpl)
      .map(off => {
        return `${off.toString(16).padStart(6, '0')}: ` +
          _.range(off, off+bpl, 2)
          .map(bo => buf.readUInt16LE(bo).toString(16).padStart(4, '0'))
          .join(' ') +
          ` '${fromR50(_.range(off, off+bpl, 2).map(bo => buf.readUInt16LE(bo)), false)}'` +
          ` "` + _.range(off, off+bpl).map(bo => {
            const byte = buf.readUInt8(bo);
            return _.inRange(byte, 32, 128) ? String.fromCharCode(byte) : '.';
          }).join('') + `"`;
      })
      .join('\n');

fs.writeFileSync(process.argv[2] + '.hexdump', dump);

console.log(`
Volume Home Block:
Index File Bitmap Size:            ${w16(homeBlock, H.IBSZ)}
Index File BitMap LBN:             0x${w32(homeBlock, H.IBLB).toString(16)}
Maximum Number of Files:           ${w16(homeBlock, H.FMAX)}
Storage Bitmap Cluster Factor:     ${w16(homeBlock, H.SBCL)}
Disk Device Type:                  ${w16(homeBlock, H.DVTY)}
Volume Structure Level:            0o${w16(homeBlock, H.VLEV).toString(8)}
Volume Name:                       ${str(homeBlock, H.VNAM, 12)}
Owner UIC:                         [${uic(homeBlock, H.VOWN)}]
Volume Characteristics:            0x${w16(homeBlock, H.VCHA).toString(16)}
First Checksum:                    0x${w16(homeBlock, H.CHK1).toString(16)} off=0x${Number(homeBlockOffset + H.CHK1).toString(16)}
Volume Creation Date:              ${str(homeBlock, H.VDAT, 14)}
Volume Owner:                      ${str(homeBlock, H.INDO, 12)} off=0x${Number(homeBlockOffset + H.INDO).toString(16)}
Second Checksum:                   0x${w16(homeBlock, H.CHK2).toString(16)}
`);

console.log(`
IndexBitmapOffset:                 0x${indexBitmapOffset.toString(16)}
FileHeadersOffset:                 0x${fileHeadersOffset.toString(16)}
`);

// File Headers offsets from on-disk structure
H.IDOF = w8(fileHeaders, H.IDOF);
H.MPOF = w8(fileHeaders, H.MPOF);

console.log(`
File Headers:
Ident Area Offset:        0x${(w8(fileHeaders, H.IDOF)*2).toString(16)} bytes
Map Area Offset:          0x${(w8(fileHeaders, H.MPOF)*2).toString(16)} bytes
File Number:              ${w16(fileHeaders, H.FNUM)}
File Sequence Number:     ${w16(fileHeaders, H.FSEQ)}
File Structure Level:     0o${w16(fileHeaders, H.FLEV).toString(8)}
File Owner:               [${uic(fileHeaders, H.FOWN)}]
`);

/*
console.log(`
File Name:                ${fromR50(w16x3(fileHeaders, H.HDHD + I.FNAM))}
File Type:                ${fromR50([w16(fileHeaders, H.HDHD + I.FTYP)])}
File Revision Date:       ${str(fileHeaders, H.HDHD + I.RVDT, 7)}
`);
*/

if ('testing' == 'not-testing') {
  console.log(`R50 [1683,6606]=${fromR50([1683, 6606])}`);
  console.log(`R50 for 'ABCDEF=${toR50('ABCDEF')}'`);
}


function str(buf, offset, len) {
  return buf.toString('latin1', offset, offset + len);
}

function w8(buf, offset) {
  return buf.readUInt8(offset);
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


// Return a three word array of w16 from offset
function w16x3(buf, offset) {
  return [buf.readUInt16LE(offset+0), buf.readUInt16LE(offset+2), buf.readUInt16LE(offset+4)];
}


function r50Byte(w, pos) {
  const div = Math.pow(40, pos);
  const cx = Math.floor(w / div) % 40;
  return r50ToASCII.charAt(cx);
}


// From the specified array of little-endian PDP-11 words in
// RADIX-50 format (three characters per word) into an ASCII string
// and return it.
function fromR50(words, trim = true) {
  const s = words.reduce((cur, w) => cur + r50Byte(w, 2) + r50Byte(w, 1) + r50Byte(w, 0), "");
  return trim ? s.trim() : s;
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


// Copy the Buffer instance `rx01RawBuf` from the physical media mapping to
// logical block mapping required by FILES-11.
function convertToLogicalBlocks(rx01RawBuf) {
  const logical = Buffer.allocUnsafe((nTracks + 1) * trackSize);

  for (let b = 0; b < nBlocks; ++b) {
    const bOffset = b * blockSize;

    for (let sectorN = 0; sectorN < sectorsPerBlock; ++sectorN) {
      const logicalSector = b * sectorsPerBlock + sectorN;
      const [track, sector] = logicalToRX01Physical(logicalSector);
      const srcOffset = track * trackSize + sector * sectorSize;
      console.log(`b=${b} sectorN=${sectorN}, logicalSector=${logicalSector}, track=${track}, sector=${sector}, srcOffset=${srcOffset}`);
      rx01RawBuf.copy(logical, bOffset + sectorN * sectorSize, srcOffset, srcOffset + sectorSize);
    }
  }

  return logical;
}


// Translate a logical sector number `s` into physical track and
// sector numbers.
//
// This fragment of C code implements the logical to physical
// track/sector translation:
//
// ```
//    #define NSECT   26
//
//    int track = blkno / NSECT;
//
//    // Alternate sectors within track using modulo
//    int i = (blkno % NSECT) * 2;
//    if (i >= NSECT) ++i;
//
//    // 6-sector offset and 1-origin sector numbering 1..26
//    int sector = (i + 6 * track) % NSECT + 1;
//
//    // Skip track 0 entirely, so 1-origin track numbering 1..76
//    ++track;
// ```
function logicalToRX01Physical(s) {
  let track = Math.floor(s / sectorsPerTrack);

  // Alternate sectors within track using modulo
  let sector = s % sectorsPerTrack * 2;
  if (sector >= sectorsPerTrack) ++sector;

  // 6-sector offset and 1-origin sector numbering 1..26
  sector = (sector + 6*track) % sectorsPerTrack + 1;

  ++track;                      // Skip track #0 entirely
  return [track, sector];
}

// RSX11mplus disk:                RX01 floppy image
// 23E volume create date          113E
// 3E4 volume owner                1464
