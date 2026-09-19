import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-[#0A0F1C]">
      {/* Left Side - Marketing & Dashboard Background */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden p-12 lg:flex">
        {/* Placeholder for the App Dashboard Background */}
        <img 
          src="/Container.png" 
          alt="Dashboard Background" 
          className="absolute inset-0 h-full w-full object-cover opacity-60" 
        />
        
        {/* Dark gradient overlay for readability if needed */}
        <div className="absolute inset-0 bg-gradient-to-b from- to-[#0A0F1C]/90"></div>
        
        {/* Top Text overlay */}
        <div className="relative z-10 text-white mt-8">
          <h1 className="mb-4 text-5xl font-bold leading-tight">
            Smarter <span className="text-blue-500">Surveys</span>, Shorter <span className="text-blue-500">Links</span>.
          </h1>
          <p className="text-lg text-slate-300 align-baseline text-center">
            Create professional surveys and smart short links.
          </p>
        </div>

        {/* Bottom Feature Cards */}
        <div className="relative z-10 flex gap-6">
          <div className="flex-1 rounded-2xl bg-[#1E293B]/80 p-6 border border-white/10 backdrop-blur-md">
            <h3 className="mb-2 text-lg font-bold text-white">Create your surveys</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              Create beautiful, customizable surveys that help you collect feedback, understand your audience, and make informed decisions.
            </p>
          </div>

          <div className="flex-1 rounded-2xl bg-[#1E293B]/80 p-6 border border-white/10 backdrop-blur-md">
            <h3 className="mb-2 text-lg font-bold text-white">URLs shortener</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              Transform long, complex URLs into short, clean, and shareable links. Track clicks, monitor performance, and manage all your links from one intuitive dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Container */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-[45%] xl:px-24 bg-white rounded-l-3xl shadow-2xl">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;