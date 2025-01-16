// @flow
// libs
import React, { useEffect, useReducer, useState } from 'react';
import { Formik } from 'formik';
import { RouteComponentProps } from 'react-router';

// src
import { copyTextToClipboard, getBrowserOrigin } from '../../utils';
import { downloadInvoice, fetchInvoiceById } from '../../actions';
import { FormContainer } from '../FormContainer';
import { reducer } from './reducer';
import { useSnackbar } from '../../components/Snackbar/useSnackbar';
import { ShareModal } from '../../components/ShareModal';
import { Values } from '../../types';

export function ViewInvoice(props: RouteComponentProps) {
  const { id } = props.match.params;
  const [{ isLoading, payload }, dispatch] = useReducer(reducer, {});
  const { showSnackbar } = useSnackbar();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    fetchInvoiceById(id, dispatch);
  }, [id]);

  if (isLoading) {
    return 'Loading...';
  }

  if (payload) {
    return (
      <>
        <Formik
          initialValues={{
            invoice: payload,
            isEditable: false,
          }}
          component={FormContainer}
          onSubmit={({ action, invoice }: Values) => {
            switch (action) {
              case 'download': {
                return downloadInvoice(payload);
              }
              case 'share': {
                setShareModalOpen(true);
                return Promise.resolve();
              }
              case 'print': {
                return window.print();
              }
            }
          }}
        />
        <ShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          invoiceId={id}
        />
      </>
    );
  }

  return 'Data not available';
}
