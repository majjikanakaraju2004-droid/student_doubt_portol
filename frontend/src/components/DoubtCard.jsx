function DoubtCard({ doubt }) {

  return (

    <div className="bg-white p-6 rounded-xl shadow-lg mb-5 border-l-4 border-blue-600">

      <h2 className="text-2xl font-bold mb-2">
        {doubt.subject}
      </h2>

      <p className="mb-2">
        <span className="font-bold">Topic:</span>
        {' '}
        {doubt.topic}
      </p>

      <p className="mb-2">
        <span className="font-bold">Question:</span>
        {' '}
        {doubt.question}
      </p>

      <p>
        <span className="font-bold">Status:</span>
        {' '}
        <span className="text-green-600 font-semibold">
          {doubt.status}
        </span>
      </p>
    </div>

  )
}

export default DoubtCard