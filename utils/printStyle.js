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
            transform: scale(0.85);
            margin-top: 100px;
        }
      }`;
}
