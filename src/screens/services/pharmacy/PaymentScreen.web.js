import React from 'react';
import CartScreen from './CartScreen';

const PaymentScreenWeb = (props) => {
  return (
    <CartScreen
      {...props}
      route={{
        ...props.route,
        params: {
          ...props.route?.params,
          openCheckout: true,
        },
      }}
    />
  );
};

export default PaymentScreenWeb;
