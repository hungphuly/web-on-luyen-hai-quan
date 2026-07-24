const xlsx = require('xlsx');
const fs = require('fs');

const data = [
  ['Tên Trường: Bồi dưỡng Cán bộ Kinh tế - Tài chính'], // Dòng rác 1
  ['Lớp: Luyện thi Hải quan'], // Dòng rác 2
  ['Ngân hàng câu hỏi trắc nghiệm'], // Dòng rác 3
  [], // Dòng rỗng
  ['TT', 'Nội dung câu hỏi', 'Đáp án', 'Phương án A', 'Phương án B', 'Phương án C', 'Phương án D', 'Căn cứ pháp lý'], // Header thực sự
  [
    '1', 
    'Câu 1 hợp lệ: Theo quy tắc 1, mã HS được phân loại dựa vào đâu?', 
    'A', 
    'Chú giải phần, chương', 
    'Tên hàng hóa thương mại', 
    'Giá trị hàng hóa', 
    'Xuất xứ hàng hóa', 
    'Thông tư 65/2017/TT-BTC'
  ],
  [
    '2', 
    'Câu 2 hợp lệ: Điều kiện FOB quy định rủi ro chuyển giao khi nào?', 
    'C', 
    'Khi hàng đặt trên cầu cảng', 
    'Khi hàng qua lan can tàu', 
    'Khi hàng đặt an toàn trên tàu', 
    'Khi hàng đến cảng đích', 
    'Incoterms 2020'
  ],
  [
    '3', 
    'Câu 3 cố tình sai đáp án', 
    'E', 
    'A', 
    'B', 
    'C', 
    'D', 
    'Luật HQ'
  ],
  [
    '4', 
    'Câu 4 thiếu căn cứ', 
    'B', 
    '1', 
    '2', 
    '3', 
    '4', 
    ''
  ],
  ['*Ghi chú: Đề này không có gì thêm'] // Dòng rác cuối
];

const ws = xlsx.utils.aoa_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
xlsx.writeFile(wb, "public/sample-questions.xlsx");
console.log("Đã tạo lại file public/sample-questions.xlsx theo chuẩn mới");
