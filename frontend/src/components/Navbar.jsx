function Navbar() {

  return (

    <div className="bg-indigo-700 text-white p-4 flex justify-between items-center shadow-lg">

      <h1 className="text-2xl font-bold">
        Student Doubt Clarification & <span className="text-gradient">Knowledge Management System</span>
      </h1>

      <div className="flex gap-4 items-center">

        <span className="font-semibold">
          Welcome Student
        </span>
        <button className="bg-red-500 px-4 py-2 rounded hover:bg-red-600">
          Logout
        </button>

      </div>

    </div>

  )
}

export default Navbar