import { db } from './config';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, setDoc, serverTimestamp
} from 'firebase/firestore';

const userCol = (uid, col) => collection(db, 'users', uid, col);

export const fsAdd = (uid, col, data) =>
  addDoc(userCol(uid, col), { ...data, erstellt: serverTimestamp() });

export const fsUpd = (uid, col, id, data) =>
  updateDoc(doc(db, 'users', uid, col, id), data);

export const fsDel = (uid, col, id) =>
  deleteDoc(doc(db, 'users', uid, col, id));

export const fsAll = async (uid, col) => {
  const snap = await getDocs(userCol(uid, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const fsWhere = async (uid, col, field, op, val) => {
  const q = query(userCol(uid, col), where(field, op, val));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const fsGet = async (uid, col, id) => {
  const snap = await getDoc(doc(db, 'users', uid, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
