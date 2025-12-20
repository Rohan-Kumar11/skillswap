export default function ProfileTabs({ activeTab, setActiveTab }) {
  return (
    <div className="mt-10 w-[98%]">
      <div className="bg-white rounded-xl shadow-md flex">
        {["posts", "reviews", "achievements", "history"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center font-medium capitalize ${
              activeTab === tab
                ? "bg-[#263247] text-white rounded-xl m-1"
                : "text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
