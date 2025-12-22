// src/app/store/slices/paymentSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

interface PaymentState {
  paymentId: string | null;
  status: PaymentStatus;
}

const initialState: PaymentState = {
  paymentId: null,
  status: 'idle',
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setPaymentId: (state, action: PayloadAction<string | null>) => {
      state.paymentId = action.payload;
    },
    setPaymentStatus: (state, action: PayloadAction<PaymentStatus>) => {
      state.status = action.payload;
    },
    clearPayment: (state) => {
      state.paymentId = null;
      state.status = 'idle';
    },
  },
});

export const { setPaymentId, setPaymentStatus, clearPayment } = paymentSlice.actions;

export default paymentSlice.reducer;
