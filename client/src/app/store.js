import { configureStore } from '@reduxjs/toolkit';
import contactsReducer from '../features/contacts/contactsSlice';

export const store = configureStore({
  reducer: {
    contacts: contactsReducer
  }
});