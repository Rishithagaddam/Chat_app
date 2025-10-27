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

export const fetchContacts = createAsyncThunk('contacts/fetchContacts', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/contacts');
    return res.data.contacts || [];
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

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
        // requestsSent: convert to id strings for quick includes checks
        state.requestsSent = (action.payload.requestsSent || []).map(u => u._id ? u._id.toString() : u.toString());
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

      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.contacts = action.payload;
      });
  }
});

export default contactsSlice.reducer;