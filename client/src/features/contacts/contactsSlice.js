import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export const fetchUsers = createAsyncThunk('contacts/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/users');
    return res.data.users || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const sendRequest = createAsyncThunk('contacts/sendRequest', async (toUserId, { rejectWithValue }) => {
  try {
    const res = await api.post('/contacts/send-request', { toUserId });
    return { toUserId, message: res.data.message };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchRequests = createAsyncThunk('contacts/fetchRequests', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/contacts/requests');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const acceptRequest = createAsyncThunk('contacts/acceptRequest', async (fromUserId, { rejectWithValue }) => {
  try {
    const res = await api.post('/contacts/accept-request', { fromUserId });
    return { fromUserId, message: res.data.message };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const rejectRequest = createAsyncThunk('contacts/rejectRequest', async (fromUserId, { rejectWithValue }) => {
  try {
    const res = await api.post('/contacts/reject-request', { fromUserId });
    return { fromUserId, message: res.data.message };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const withdrawRequest = createAsyncThunk(
  'contacts/withdrawRequest',
  async (toUserId, { rejectWithValue }) => {
    try {
      const res = await api.post('/contacts/withdraw-request', { toUserId });
      return { toUserId, message: res.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/contacts');
    return res.data.contacts || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Add this thunk action
export const deleteContact = createAsyncThunk(
  'contacts/deleteContact',
  async (contactId, { rejectWithValue }) => {
    try {
      await api.delete(`/users/contacts/${contactId}`);
      return contactId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const contactsSlice = createSlice({
  name: 'contacts',
  initialState: {
    users: [],
    contacts: [],
    // requestsReceived keeps populated user objects (for display)
    requestsReceived: [],
    // requestsSent keeps array of user id strings (for quick checks)
    requestsSent: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.users = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(sendRequest.fulfilled, (state, action) => {
        state.requestsSent.push(action.payload.toUserId);
      })
      .addCase(sendRequest.rejected, (state, action) => { state.error = action.payload; })

      .addCase(fetchRequests.fulfilled, (state, action) => {
        // requestsReceived: populated user objects
        state.requestsReceived = action.payload.requestsReceived || [];
        // requestsSent: keep as populated user objects for display
        state.requestsSent = action.payload.requestsSent || [];
      })
      .addCase(fetchRequests.rejected, (state, action) => { state.error = action.payload; })

      .addCase(acceptRequest.fulfilled, (state, action) => {
        const id = action.payload.fromUserId;
        // remove from requestsReceived list
        state.requestsReceived = state.requestsReceived.filter(u => (u._id?.toString() || u.toString()) !== id);
        // also remove from requestsSent if present (safety)
        state.requestsSent = state.requestsSent.filter(sid => sid !== id);
      })
      .addCase(acceptRequest.rejected, (state, action) => { state.error = action.payload; })

      .addCase(rejectRequest.fulfilled, (state, action) => {
        const id = action.payload.fromUserId;
        state.requestsReceived = state.requestsReceived.filter(u => (u._id?.toString() || u.toString()) !== id);
      })
      .addCase(rejectRequest.rejected, (state, action) => { state.error = action.payload; })

      .addCase(withdrawRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(withdrawRequest.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the request from requestsSent array
        state.requestsSent = state.requestsSent.filter(
          req => req._id !== action.payload.toUserId
        );
      })
      .addCase(withdrawRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.contacts = action.payload;
      })

      .addCase(deleteContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = state.contacts.filter(c => 
          (c._id || c).toString() !== action.payload.toString()
        );
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default contactsSlice.reducer;