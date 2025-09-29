// Shared state management for Vercel serverless functions
// In production, this should be replaced with Redis or a database

let currentPoll = null;
let answeredStudents = new Set();
let allStudents = new Set();
let pollTimer = null;
const studentIdToName = new Map();

export const getCurrentPoll = () => currentPoll;
export const setCurrentPoll = (poll) => { currentPoll = poll; };

export const getAnsweredStudents = () => answeredStudents;
export const addAnsweredStudent = (studentId) => answeredStudents.add(studentId);
export const clearAnsweredStudents = () => answeredStudents.clear();

export const getAllStudents = () => allStudents;
export const addStudent = (studentId) => allStudents.add(studentId);
export const removeStudent = (studentId) => allStudents.delete(studentId);

export const getStudentName = (studentId) => studentIdToName.get(studentId);
export const setStudentName = (studentId, name) => studentIdToName.set(studentId, name);
export const removeStudentName = (studentId) => studentIdToName.delete(studentId);

export const getPollTimer = () => pollTimer;
export const setPollTimer = (timer) => { pollTimer = timer; };
export const clearPollTimer = () => {
    if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
    }
};
