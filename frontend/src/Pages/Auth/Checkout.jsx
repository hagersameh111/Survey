import { useState } from "react";
import { Link } from "react-router-dom";

const Checkout = () => {
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  const handleCheckout = (e) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] py-12 px-6 flex justify-center">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Payment Form */}
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h2>
          <form onSubmit={handleCheckout} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Name on Card</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="0000 0000 0000 0000"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">CVC</label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Pay $144.00
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="rounded-3xl bg-gray-900 p-8 text-white shadow-xl h-fit">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
            <div>
              <h3 className="font-semibold">Pro Plan (Annual)</h3>
              <p className="text-sm text-gray-400">Billed yearly</p>
            </div>
            <span className="font-bold">$144.00</span>
          </div>
          
          <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
            <span>Subtotal</span>
            <span>$144.00</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-400 mb-6">
            <span>Tax (0%)</span>
            <span>$0.00</span>
          </div>
          
          <div className="flex justify-between items-center text-lg font-bold border-t border-gray-700 pt-4">
            <span>Total</span>
            <span>$144.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;