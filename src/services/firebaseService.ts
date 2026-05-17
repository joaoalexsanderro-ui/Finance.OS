import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Bank, CreditCard, Goal, Transaction } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
};

const getBaseRef = () => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  return doc(db, 'users', auth.currentUser.uid);
};

export const subscribeToData = (
  onData: (data: { banks: Bank[], cards: CreditCard[], goals: Goal[], transactions: Transaction[] }) => void
) => {
  if (!auth.currentUser) return () => {};

  const userRef = getBaseRef();
  const banksRef = collection(userRef, 'banks');
  const cardsRef = collection(userRef, 'cards');
  const goalsRef = collection(userRef, 'goals');
  const transactionsRef = collection(userRef, 'transactions');

  let banks: Bank[] = [];
  let cards: CreditCard[] = [];
  let goals: Goal[] = [];
  let transactions: Transaction[] = [];

  const update = () => onData({ banks, cards, goals, transactions });

  const unsubBanks = onSnapshot(banksRef, (snap) => {
    banks = snap.docs.map(d => ({ id: d.id, ...d.data() } as Bank));
    update();
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'banks'));

  const unsubCards = onSnapshot(cardsRef, (snap) => {
    cards = snap.docs.map(d => ({ id: d.id, ...d.data() } as CreditCard));
    update();
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'cards'));

  const unsubGoals = onSnapshot(goalsRef, (snap) => {
    goals = snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal));
    update();
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'goals'));

  const unsubTransactions = onSnapshot(transactionsRef, (snap) => {
    transactions = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
    // Sort transactions by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    update();
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

  return () => {
    unsubBanks();
    unsubCards();
    unsubGoals();
    unsubTransactions();
  };
};

export const saveBank = async (bank: Bank) => {
  const path = `users/${auth.currentUser?.uid}/banks/${bank.id}`;
  try {
    const bankRef = doc(getBaseRef(), 'banks', bank.id);
    const { id, ...data } = bank;
    await setDoc(bankRef, data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const deleteBankDoc = async (id: string) => {
  const path = `users/${auth.currentUser?.uid}/banks/${id}`;
  try {
    await deleteDoc(doc(getBaseRef(), 'banks', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

export const saveCard = async (card: CreditCard) => {
  const path = `users/${auth.currentUser?.uid}/cards/${card.id}`;
  try {
    const cardRef = doc(getBaseRef(), 'cards', card.id);
    const { id, ...data } = card;
    await setDoc(cardRef, data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const deleteCardDoc = async (id: string) => {
  const path = `users/${auth.currentUser?.uid}/cards/${id}`;
  try {
    await deleteDoc(doc(getBaseRef(), 'cards', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

export const saveGoal = async (goal: Goal) => {
  const path = `users/${auth.currentUser?.uid}/goals/${goal.id}`;
  try {
    const goalRef = doc(getBaseRef(), 'goals', goal.id);
    const { id, ...data } = goal;
    await setDoc(goalRef, data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const deleteGoalDoc = async (id: string) => {
  const path = `users/${auth.currentUser?.uid}/goals/${id}`;
  try {
    await deleteDoc(doc(getBaseRef(), 'goals', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

export const saveTransaction = async (transaction: Transaction) => {
  const path = `users/${auth.currentUser?.uid}/transactions/${transaction.id}`;
  try {
    const transactionRef = doc(getBaseRef(), 'transactions', transaction.id);
    const { id, ...data } = transaction;
    // Ensure data values are defined for Firestore
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(transactionRef, cleanData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

export const deleteTransactionDoc = async (id: string) => {
  const path = `users/${auth.currentUser?.uid}/transactions/${id}`;
  try {
    await deleteDoc(doc(getBaseRef(), 'transactions', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};
