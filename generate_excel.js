const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbook = xlsx.utils.book_new();

// Header row mapping the expected columns
const headers = [
  'TT',
  'Nội dung câu hỏi',
  'Đáp án đúng (A/B/C/D)',
  'Lựa chọn A',
  'Lựa chọn B',
  'Lựa chọn C',
  'Lựa chọn D',
  'Căn cứ pháp lý (Văn bản/Điều khoản)',
  'Độ khó (1=Dễ, 2=TB, 3=Khó)',
  'Phân loại (1=Ôn luyện, 2=Thi thử, 3=Thi thật)'
];

// Sample data
const sampleData = [
  [
    1,
    'Theo quy định, thời hạn nộp thuế đối với hàng hóa xuất khẩu, nhập khẩu là bao lâu?',
    'a',
    'Trước khi thông quan hoặc giải phóng hàng hóa',
    'Sau 30 ngày kể từ ngày thông quan',
    'Sau 15 ngày kể từ ngày thông quan',
    'Ngay sau khi hàng hóa về đến cửa khẩu',
    'Điều 9, Luật Thuế xuất khẩu, thuế nhập khẩu 2016',
    2,
    1
  ],
  [
    2,
    'Hàng hóa nào sau đây thuộc đối tượng chịu thuế xuất khẩu?',
    'b',
    'Hàng hóa quá cảnh',
    'Hàng hóa xuất khẩu ra nước ngoài',
    'Hàng hóa viện trợ nhân đạo',
    'Hàng hóa từ khu phi thuế quan xuất khẩu ra nước ngoài',
    'Điều 2, Luật Thuế xuất khẩu, thuế nhập khẩu 2016',
    1,
    2
  ]
];

const worksheetData = [headers, ...sampleData];
const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

// Set column widths for better readability
worksheet['!cols'] = [
  { wch: 5 },  // TT
  { wch: 60 }, // Nội dung
  { wch: 20 }, // Đáp án
  { wch: 30 }, // Lựa chọn A
  { wch: 30 }, // Lựa chọn B
  { wch: 30 }, // Lựa chọn C
  { wch: 30 }, // Lựa chọn D
  { wch: 40 }, // Căn cứ pháp lý
  { wch: 25 }, // Độ khó
  { wch: 40 }  // Phân loại
];

xlsx.utils.book_append_sheet(workbook, worksheet, 'CauHoi');

const outputPath = path.join(__dirname, 'public', 'mau_import_cau_hoi.xlsx');
xlsx.writeFile(workbook, outputPath);

console.log(`Đã tạo file mẫu Excel tại: ${outputPath}`);
