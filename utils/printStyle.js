export default function printStyle() {
  return `
    @media print {
        html, body {
            display: inline-block;
        }
        @page { 
            size: A4 landscape;
        }
        .shift-table{
            margin-top: 100px;
            margin-left: 3rem;
            margin-right: 3rem;
        }
      }`;
}
