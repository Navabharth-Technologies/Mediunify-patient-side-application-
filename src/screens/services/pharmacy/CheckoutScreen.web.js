import React from 'react';
import CartScreen from './CartScreen';

const CheckoutScreenWeb = (props) => {
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

export default CheckoutScreenWeb;
