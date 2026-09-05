import type { ClinicRepository } from './contracts';
import * as firebaseStore from '../firebase/db';

/**
 * Composition root for persistence. To migrate to Supabase, a REST API, or
 * another database, replace only this adapter import with an implementation of
 * ClinicRepository; callers remain unchanged.
 */
export const repository: ClinicRepository = {
  fetchPatients: firebaseStore.fetchPatients,
  fetchPatientsByTherapist: firebaseStore.fetchPatientsByTherapist,
  fetchAllPatients: firebaseStore.fetchAllPatients,
  createPatient: firebaseStore.createPatient,
  updatePatient: firebaseStore.updatePatientDoc,
  deletePatient: firebaseStore.deletePatientDoc,
  fetchAppointments: firebaseStore.fetchAppointments,
  fetchAppointmentsByTherapist: firebaseStore.fetchAppointmentsByTherapist,
  fetchAllAppointments: firebaseStore.fetchAllAppointments,
  createAppointment: firebaseStore.createAppointment,
  updateAppointment: firebaseStore.updateAppointmentDoc,
  deleteAppointment: firebaseStore.deleteAppointmentDoc,
  fetchPrescriptions: firebaseStore.fetchPrescriptions,
  createPrescription: firebaseStore.createPrescription,
  updatePrescription: firebaseStore.updatePrescriptionDoc,
  deletePrescription: firebaseStore.deletePrescriptionDoc,
  fetchProgressRecords: firebaseStore.fetchProgressRecords,
  fetchProgressRecordsByTherapist: firebaseStore.fetchProgressRecordsByTherapist,
  fetchAllProgressRecords: firebaseStore.fetchAllProgressRecords,
  createProgressRecord: firebaseStore.createProgressRecord,
  updateProgressRecord: firebaseStore.updateProgressRecordDoc,
  deleteProgressRecord: firebaseStore.deleteProgressRecordDoc,
  fetchUserProfile: firebaseStore.fetchUserProfile,
  createUserProfile: firebaseStore.createUserProfile,
  fetchUsers: firebaseStore.fetchUsers,
  approveUser: firebaseStore.approveUser,
  updateUserRole: firebaseStore.updateUserRole,
  deleteUser: firebaseStore.deleteUserDoc,
  disableUser: firebaseStore.disableUser,
  enableUser: firebaseStore.enableUser,
  fetchBudget: firebaseStore.fetchBudget,
  saveBudget: firebaseStore.saveBudget,
};

export type { ClinicRepository } from './contracts';
