function Sidebar() {

  return (

    <div className="bg-slate-900 text-white w-64 min-h-screen p-6">

      <h2 className="text-2xl font-bold mb-10">
        Dashboard
      </h2>

      <ul className="space-y-6 text-lg">

        <li className="hover:text-blue-400 cursor-pointer">
          Home
        </li>

        <li className="hover:text-blue-400 cursor-pointer">
          My Doubts
        </li>

        <li className="hover:text-blue-400 cursor-pointer">
          AI Suggestions
        </li>
        <li className="hover:text-blue-400 cursor-pointer">
          Profile
        </li>

      </ul>

    </div>

  )
}

export default Sidebar