import {
  Clock3,
} from "lucide-react";

const WelcomePage = () => {
  return (
    <main className="flex-1 rounded-3xl bg-[#F8FAFF] p-16">

      {/* Title */}

      <h1 className="mb-10 text-center text-5xl font-bold text-primary">
        Welcome, we'd love your feedback
      </h1>

      {/* Subtitle */}

      <p className="mx-auto mb-14 max-w-5xl text-center text-2xl leading-relaxed text-text">

        Your honest input helps us making better decisions in the future.

        Please share your thoughts,

        every bit of feedback is appreciated.

      </p>

      {/* Button */}

      <div className="flex justify-center">

        <button className="rounded-xl bg-primary px-16 py-5 text-2xl font-semibold text-white transition hover:bg-primary-hover">

          Start Now

        </button>

      </div>

      {/* Duration */}

      <div className="mt-10 flex items-center justify-center gap-3 text-primary">

        <Clock3 size={22} />

        <span className="text-xl">
          Takes 10 min.
        </span>

      </div>

      {/* Contact */}

      <div className="mt-28">

        <h2 className="mb-4 text-center text-4xl font-semibold">

          Contact Details:

        </h2>

        <p className="text-center text-3xl text-primary underline">

          admin12345@mail.com

        </p>

      </div>

      {/* Footer */}

      <div className="mx-auto mt-16 max-w-6xl">

        <p className="text-center text-xl leading-10 text-text-secondary">

          If you wish to make a formal complaint regarding this research,

          you may contact the Academic Supervisor.

          Your communication may also be referred to an independent person,

          where appropriate.

        </p>

      </div>

    </main>
  );
};

export default WelcomePage;