<table className="border-collapse border w-full text-center shadow-md border-spacing-2">
  <thead className="border">
    <tr className="border">
      <td className="border bg-primary border-b-4 border-green text-xl p-3 text-white">
        ชื่อ-สกุล
      </td>
      <td className="border bg-primary border-b-4 border-green text-xl p-3 text-white">
        ตำแหน่ง
      </td>
      <td className="border bg-primary border-b-4 border-green text-xl p-3 text-white">
        งานที่ปฏิบัติ
      </td>
      {/* จำนวนวันของเดือน */}
      {[...Array(daysInCurrentMonth).keys()].map((i) => (
        <td
          className="border bg-primary border-b-4 border-green text-xl text-white w-12"
          colSpan={i + 1}
          rowSpan={1}
        >
          {i + 1}
        </td>
      ))}
    </tr>
  </thead>
  <tbody>
    {/* จำนวนของชื่อ */}
    {uniquePerson?.map((person, index) => (
      <tr className="odd:bg-greenLight even:bg-green">
        <td className="border border-primary text-xl">{person.name}</td>
        <td className="border border-primary text-xl">{person.position}</td>
        <td className="border border-primary text-xl">{person.location}</td>
        {/* แสดงรายละเอียดของตาราง กะ */}
        {[...Array(daysInCurrentMonth).keys()].map((i) => (
          <td className="border border-primary text-lg">
            {work
              ?.filter(
                (person) =>
                  person.name === person.name &&
                  new Date(person.day).getDate() == i + 1
              )
              .map((req) => (
                <>
                  <span>{req.shift}</span>
                </>
              ))}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>;
