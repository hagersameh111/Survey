import { useState } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for individuals starting out.",
      features: ["Up to 3 forms", "100 responses/month", "Basic analytics", "Standard support"],
      buttonText: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: isAnnual ? "$12" : "$15",
      period: "/month",
      description: "Ideal for professionals and small teams.",
      features: ["Unlimited forms", "5,000 responses/month", "Advanced analytics", "Custom branding", "Priority support"],
      buttonText: "Choose Pro",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with complex needs.",
      features: ["Unlimited everything", "Dedicated success manager", "SSO integration", "Custom contract"],
      buttonText: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFD] py-20 px-6">
      <div className="mx-auto max-w-6xl text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Simple, transparent pricing</h1>
        <p className="mb-10 text-lg text-gray-500">Choose the perfect plan for your needs. Always know what you'll pay.</p>

        {/* Billing Toggle */}
        <div className="mb-16 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!isAnnual ? "text-gray-900" : "text-gray-500"}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative flex h-8 w-14 items-center rounded-full bg-blue-600 p-1 transition"
          >
            <div className={`h-6 w-6 rounded-full bg-white transition-transform ${isAnnual ? "translate-x-6" : ""}`} />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? "text-gray-900" : "text-gray-500"}`}>
            Annually <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Save 20%</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-8 text-left transition-transform hover:-translate-y-1 ${
                plan.highlighted
                  ? "border-2 border-blue-600 bg-white shadow-xl"
                  : "border border-gray-200 bg-white shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
              
              <div className="my-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                {plan.period && <span className="text-gray-500">{plan.period}</span>}
              </div>

              <ul className="mb-8 flex-1 space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-700">
                    <Check size={18} className="text-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to="/checkout"
                className={`block w-full rounded-xl py-3.5 text-center text-sm font-medium transition ${
                  plan.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                }`}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;