import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

function Register() {

  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  })

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })

  }

  const handleRegister = (e) => {

    e.preventDefault()

    console.log(formData)

    alert('Account Created Successfully')

    navigate('/')

  }

  return (

    <div className="min-h-screen flex">

      {/* Left Section */}

      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-teal-600 text-white flex-col justify-center items-center p-10">

        <h1 className="text-5xl font-bold mb-6">

          AI Doubt Portal

        </h1>

        <p className="text-xl text-center leading-8 max-w-lg">

          Create your account and access the
          smart Student Doubt Clarification & Knowledge Management platform.

        </p>

        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
          alt="education"
          className="w-72 mt-10"
        />

      </div>

      {/* Right Section */}

      <div className="w-full md:w-1/2 bg-gray-100 flex justify-center items-center">

        <div className="bg-white shadow-2xl rounded-2xl p-10 w-[450px]">

          <h2 className="text-4xl font-bold text-center text-blue-700 mb-2">

            Create Account

          </h2>

          <p className="text-gray-500 text-center mb-8">

            Register to continue

          </p>

          <form onSubmit={handleRegister}>

            <div className="mb-5">

              <label className="block mb-2 font-semibold">

                Full Name

              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            <div className="mb-5">

              <label className="block mb-2 font-semibold">

                Email

              </label>

              <input
                type="email"
                name="email"
                placeholder="Enter Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            <div className="mb-5">

              <label className="block mb-2 font-semibold">

                Password

              </label>

              <input
                type="password"
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            <div className="mb-6">

              <label className="block mb-2 font-semibold">

                Select Role

              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="student">

                  Student

                </option>

                <option value="teacher">

                  Teacher

                </option>

              </select>

            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-br from-blue-600 to-teal-600 text-white p-4 rounded-lg hover:bg-blue-800 text-lg font-semibold transition duration-300"
            >

              Create Account

            </button>

          </form>

          <p className="text-center mt-6 text-gray-500">

            Already have an account?

            <Link
              to="/"
              className="text-blue-700 font-semibold ml-2"
            >

              Login

            </Link>

          </p>

        </div>

      </div>

    </div>

  )
}

export default Register