import { BoardCore, getFinalFenFromPgn } from 'eg-chessboard';
import RoiFenEditor from './components/FenEditor';
import RoiPgnEditor from './components/PgnEditor';

window.RoiFenEditor = RoiFenEditor;
window.RoiPgnEditor = RoiPgnEditor;
window.EgBoardCore = BoardCore;
window.getFinalFenFromPgn = getFinalFenFromPgn;
