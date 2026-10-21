import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SAMPLE_DECISION_108_TEACHERS } from '../src/constants/initialData.js';
import { LogPeriodEntry, TeacherAssignment } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const WEEKS_DIR = path.resolve(DATA_DIR, 'weeks');

if (!fs.existsSync(WEEKS_DIR)) {
  fs.mkdirSync(WEEKS_DIR, { recursive: true });
}

// Ensure teachers.json has all teachers
const TEACHERS_FILE = path.resolve(DATA_DIR, 'teachers.json');
fs.writeFileSync(TEACHERS_FILE, JSON.stringify(SAMPLE_DECISION_108_TEACHERS, null, 2), 'utf-8');
console.log('Seeded teachers.json with 21 Decision 108 teachers.');

// Subject lesson curriculums for 18 weeks
const CURRICULUM: Record<string, string[]> = {
  Toán: [
    'Tập hợp và mệnh đề logic trong chứng minh toán học',
    'Bất đẳng thức Cauchy cơ bản và kỹ thuật thêm bớt',
    'Phương trình hàm đa thức bậc nhất và bậc hai',
    'Định lý Menelaus và Ceva trong hình học phẳng',
    'Bất đẳng thức Cauchy-Schwarz trong bài toán cực trị', // W5
    'Bất đẳng thức Bunhiacopxki và dạng phân thức Engel',
    'Nguyên lý Dirichlet và bài toán chia kẹo Euler',
    'Phương trình hàm Cauchy trên tập số hữu tỉ và số thực',
    'Tổ hợp: Bài toán đếm lặp và quy tắc cộng nhân nâng cao',
    'Hàng điểm điều hòa và chùm điều hòa trong tam giác',
    'Đa thức với hệ số nguyên và tiêu chuẩn bất khả quy Eisenstein',
    'Số học: Đồng dư thức và Định lý Fermat nhỏ, Euler',
    'Phương trình Diophante bậc hai và phương trình Pell',
    'Hình học: Định lý Pascal và Desargues',
    'Dãy số xác định bởi công thức truy hồi tuyến tính',
    'Giới hạn của dãy số và định lý kẹp nâng cao',
    'Luyện giải đề thi HSG Quốc gia môn Toán số 01',
    'Tổng kết chuyên đề và ôn tập thi chọn đội tuyển chính thức',
  ],
  Lí: [
    'Động lực học chất điểm: Các định luật Newton và lực liên kết',
    'Chuyển động trong trọng trường và lực cản môi trường',
    'Định luật bảo toàn cơ năng và thế năng trong trường lực',
    'Va chạm đàn hồi và bảo toàn động lượng của hệ chất điểm',
    'Động lực học vật rắn: Mômen quán tính và định luật quay', // W5
    'Dao động điều hòa của con lắc đơn và con lắc vật lý',
    'Dao động tắt dần, dao động cưỡng bức và hiện tượng cộng hưởng',
    'Sóng cơ học và sự giao thoa sóng trong không gian',
    'Nhiệt học: Phương trình trạng thái khí lý tưởng và định luật chất khí',
    'Nguyên lý I và II của nhiệt động lực học',
    'Điện trường tĩnh: Định luật Gauss và điện thế',
    'Tụ điện và năng lượng điện trường trong chất điện môi',
    'Từ trường của dòng điện không đổi và định luật Ampere',
    'Hiện tượng cảm ứng điện từ và định luật Faraday - Lenz',
    'Dao động điện từ trong mạch LC và dao động điện từ cưỡng bức',
    'Quang hình học: Lăng kính, thấu kính và hệ quang học phức hợp',
    'Giao thoa ánh sáng qua khe Young và bản mỏng',
    'Tổng hợp phương pháp giải bài toán thực hành thí nghiệm Vật lý',
  ],
  Hóa: [
    'Cấu tạo nguyên tử và bảng tuần hoàn các nguyên tố hóa học',
    'Liên kết hóa học và hình học phân tử theo thuyết VSEPR',
    'Nhiệt động hóa học: Nhiệt phản ứng và hàm trạng thái Enthalpy',
    'Entropy, Năng lượng tự do Gibbs và chiều hướng phản ứng',
    'Liên kết hoá học và cân bằng hóa học trong dung dịch', // W5
    'Động hóa học: Tốc độ phản ứng và năng lượng hoạt hóa',
    'Cân bằng axit - bazơ theo Bronsted và chuẩn độ pH',
    'Cân bằng kết tủa và tích số tan của hợp chất ít tan',
    'Cân bằng tạo phức chất và ứng dụng trong phân tích',
    'Điện hóa học: Thế điện cực chuẩn và phương trình Nernst',
    'Pin điện và các quá trình ăn mòn kim loại',
    'Hóa học các nguyên tố nhóm A: Halogen và Oxi - Lưu huỳnh',
    'Hóa học kim loại chuyển tiếp nhóm B và hợp chất phối trí',
    'Hóa hữu cơ: Hiệu ứng cấu trúc và cơ chế phản ứng thế gốc tự do',
    'Cơ chế phản ứng thế nucleophil SN1, SN2 và tách E1, E2',
    'Hợp chất carbonyl: Phản ứng cộng nucleophil và ngưng tụ aldol',
    'Hợp chất thiên nhiên: Carbohydrate, Amino acid và Peptide',
    'Tổng hợp phương pháp giải đề thi chọn HSG Quốc gia Hóa học',
  ],
  Sinh: [
    'Thành phần hóa học của tế bào: Đại phân tử sinh học',
    'Cấu trúc và chức năng của màng sinh chất và các bào quan',
    'Chuyển hóa vật chất và năng lượng: Enzyme và hô hấp tế bào',
    'Quang hợp ở thực vật C3, C4 và CAM',
    'Cơ chế di truyền ở cấp độ phân tử: Tái bản ADN và phiên mã', // W5
    'Điều hòa biểu hiện gen ở sinh vật nhân sơ và nhân thực',
    'Đột biến gen: Cơ chế phát sinh và hậu quả sinh học',
    'Nhiễm sắc thể và các dạng đột biến cấu trúc, số lượng NST',
    'Quy luật di truyền Mendel và mở rộng học thuyết di truyền',
    'Di truyền liên kết gen, hoán vị gen và bản đồ di truyền',
    'Di truyền học quần thể: Định luật Hardy - Weinberg',
    'Sinh thái học: Quần thể sinh vật và biến động số lượng',
    'Quần xã sinh vật: Cấu trúc dinh dưỡng và diễn thế sinh thái',
    'Hệ sinh thái và chu trình sinh địa hóa toàn cầu',
    'Sinh lý thực vật: Trao đổi nước, dinh dưỡng khoáng và sinh trưởng',
    'Sinh lý động vật: Tiêu hóa, tuần hoàn và bài tiết',
    'Hệ thần kinh, cảm ứng và tập tính ở động vật',
    'Ôn tập tổng hợp và giải đề thi học sinh giỏi các cấp môn Sinh',
  ],
  'Tin học': [
    'Cấu trúc dữ liệu mảng, danh sách liên kết và ngăn xếp, hàng đợi',
    'Kỹ thuật tìm kiếm nhị phân và hai con trỏ (Two Pointers)',
    'Các thuật toán sắp xếp nâng cao và phương pháp chia để trị',
    'Quy hoạch động 1 chiều: Bài toán cái túi và dãy con tăng dài nhất',
    'Quy hoạch động 2 chiều và quy hoạch động trên lưới ô vuông', // W5
    'Cấu trúc dữ liệu Disjoint Set Union (DSU) và ứng dụng',
    'Lý thuyết đồ thị: Biểu diễn đồ thị và duyệt DFS, BFS',
    'Tìm đường đi ngắn nhất: Thuật toán Dijkstra và Floyd-Warshall',
    'Cây khung nhỏ nhất: Thuật toán Kruskal và Prim',
    'Cấu trúc dữ liệu cây chỉ số nhị phân (Fenwick Tree / Binary Indexed Tree)',
    'Cấu trúc dữ liệu cây đoạn (Segment Tree) cơ bản và Lazy Propagation',
    'Xử lý xâu ký tự: Thuật toán băm xâu (String Hashing) và KMP',
    'Số học trong tin học: Thuật toán Euclid mở rộng và sàng Eratosthenes',
    'Hình học tính toán: Tích có hướng và thuật toán tìm bao lồi Graham',
    'Quy hoạch động trên cây (DP on Tree) và Bitmask DP',
    'Kỹ thuật tối ưu hóa quy hoạch động: Convex Hull Trick',
    'Luyện tập bộ đề thi Olympic Duyên hải & Đồng bằng Bắc Bộ',
    'Tổng duyệt giải thuật và chiến thuật làm bài thi HSG Quốc gia',
  ],
  'Ngữ văn': [
    'Đặc trưng thể loại văn học trung đại và cảm hứng thế sự',
    'Chủ nghĩa nhân đạo trong truyện thơ Nôm thời trung đại',
    'Kỹ năng viết bài nghị luận xã hội: Tư tưởng đạo lý nâng cao',
    'Kỹ năng viết bài nghị luận xã hội: Hiện tượng đời sống và góc nhìn đa chiều',
    'Thi pháp thơ Mới 1932 - 1945 và cái tôi trữ tình', // W5
    'Cảm hứng lãng mạn và tinh thần sử thi trong văn học kháng chiến',
    'Chủ nghĩa hiện thực trong văn xuôi Việt Nam hiện đại',
    'Hình tượng người lính và sức mạnh tình đồng đội trong thơ ca',
    'Lý luận văn học: Bản chất xã hội và tính thẩm mỹ của văn học',
    'Lý luận văn học: Mối quan hệ giữa văn học và hiện thực đời sống',
    'Lý luận văn học: Cá tính sáng tạo và phong cách nghệ thuật của nhà văn',
    'Lý luận văn học: Quá trình tiếp nhận văn học và vai trò của độc giả',
    'Thi pháp tiểu thuyết hiện đại và kỹ thuật trần thuật',
    'Ngôn ngữ nghệ thuật và biểu tượng thơ ca hiện đại',
    'Nghị luận so sánh văn học: Đối sánh hai hình tượng nhân vật',
    'Nghị luận so sánh văn học: Đối sánh hai đoạn thơ cùng đề tài',
    'Rèn luyện kỹ năng phát hiện và giải mã đề thi HSG Quốc gia',
    'Tổng kết chuyên đề bồi dưỡng đội tuyển HSG Ngữ văn',
  ],
  Anh: [
    'Advanced Inversion structures and Cleft sentences',
    'Conditionals: Mixed types, Inverted conditionals and Alternatives',
    'Subjunctive mood and Unreal past expressions',
    'Relative clauses, Participle clauses and Reduced clauses',
    'Verb patterns, Gerunds and Infinitives in academic contexts', // W5
    'Passive voice: Advanced passive forms and Causative constructions',
    'Phrasal verbs with multiple meanings in advanced English',
    'Collocations and Idiomatic expressions for C1/C2 levels',
    'Word formation: Prefixes, Suffixes and Compound adjectives',
    'Reading Comprehension: Gapped text and Multiple matching techniques',
    'Reading Comprehension: Identifying tone, attitude and implicit meaning',
    'Open Cloze: Strategies for prepositions, pronouns and conjunctions',
    'Word formation task: Academic vocabulary from root words',
    'Trios of sentences / Vocabulary in context for National Contests',
    'Writing: Academic Essay on Environmental and Technological trends',
    'Writing: Proposal and Report writing for Advanced candidates',
    'Full mock test 01: Specialized English National Examination',
    'Full mock test 02: Review of common pitfalls and high-score strategies',
  ],
  Sử: [
    'Việt Nam từ năm 1858 đến cuối thế kỷ XIX: Kháng chiến chống Pháp',
    'Các phong trào yêu nước đầu thế kỷ XX: Phan Bội Châu và Phan Châu Trinh',
    'Hoạt động cứu nước của Nguyễn Ái Quốc (1911 - 1930)',
    'Sự thành lập Đảng Cộng sản Việt Nam và Cương lĩnh chính trị đầu tiên',
    'Phong trào cách mạng 1930 - 1935 và Xô viết Nghệ - Tĩnh', // W5
    'Phong trào dân chủ 1936 - 1939: Bài học về tập hợp lực lượng quần chúng',
    'Cách mạng tháng Tám năm 1945: Thời cơ, diễn biến và ý nghĩa lịch sử',
    'Cuộc kháng chiến toàn quốc chống thực dân Pháp (1946 - 1954)',
    'Chiến dịch Điện Biên Phủ 1954: Đỉnh cao thắng lợi quân sự và Hiệp định Genève',
    'Xây dựng CNXH ở miền Bắc và đấu tranh chống chiến lược chiến tranh ở miền Nam',
    'Cuộc Tổng tiến công và nổi dậy Xuân Mậu Thân 1968',
    'Chiến dịch Điện Biên Phủ trên không 1972 và Hiệp định Paris 1973',
    'Cuộc Tổng tiến công và nổi dậy mùa Xuân 1975 giải phóng hoàn toàn miền Nam',
    'Lịch sử thế giới: Trật tự hai cực Ianta và Chiến tranh Lạnh',
    'Phong trào giải phóng dân tộc ở Á, Phi, Mỹ Latinh sau 1945',
    'Sự phát triển của Mỹ, Tây Âu, Nhật Bản và xu thế liên kết khu vực',
    'Cách mạng khoa học - công nghệ và xu thế toàn cầu hóa cuối thế kỷ XX',
    'Rèn luyện kỹ năng phân tích, so sánh các sự kiện lịch sử trọng đại',
  ],
  'Địa lí': [
    'Các quy luật địa lý chung của vỏ địa lý: Quy luật địa đới và phi địa đới',
    'Thạch quyển: Nội lực, ngoại lực và sự hình thành các dạng địa hình',
    'Khí quyển: Sự phân bố nhiệt độ, khí áp, gió và hoàn lưu khí quyển',
    'Thủy quyển: Tuần hoàn nước, chế độ dòng chảy sông ngòi và hải lưu',
    'Địa lý tự nhiên Việt Nam: Vị trí địa lý và đặc điểm phạm vi lãnh thổ', // W5
    'Đặc điểm chung của địa hình Việt Nam và các khu vực địa hình',
    'Khí hậu nhiệt đới ẩm gió mùa và sự phân hóa khí hậu đa dạng',
    'Thủy văn: Đặc điểm mạng lưới sông ngòi và chế độ nước ở nước ta',
    'Đất và sinh vật: Sự phân hóa thổ nhưỡng và tính đa dạng sinh học',
    'Vấn đề sử dụng hợp lý và bảo vệ tài nguyên thiên nhiên, môi trường',
    'Địa lý dân cư: Cơ cấu dân số, lao động và phân bố dân cư',
    'Địa lý kinh tế: Chuyển dịch cơ cấu kinh tế theo ngành và lãnh thổ',
    'Vấn đề phát triển nông nghiệp, lâm nghiệp và thủy sản',
    'Vấn đề phát triển công nghiệp: Cơ cấu ngành và các vùng công nghiệp trọng điểm',
    'Vấn đề phát triển ngành giao thông vận tải, bưu chính viễn thông và du lịch',
    'Phân hóa lãnh thổ: Vùng Trung du miền núi Bắc Bộ và Đồng bằng sông Hồng',
    'Phân hóa lãnh thổ: Vùng Duyên hải Nam Trung Bộ, Tây Nguyên và Đông Nam Bộ',
    'Vấn đề phát triển kinh tế biển đảo và củng cố an ninh quốc phòng',
  ],
  GDKTPL: [
    'Nền kinh tế thị trường định hướng XHCN: Khái niệm và đặc trưng',
    'Quy luật giá trị và cơ chế cạnh tranh trong sản xuất kinh doanh',
    'Quy luật cung - cầu và ảnh hưởng của giá cả thị trường',
    'Thị trường lao động và thị trường việc làm trong bối cảnh 4.0',
    'Hệ thống chính trị nước CHXHCN Việt Nam: Bản chất và vai trò', // W5
    'Quyền con người, quyền và nghĩa vụ cơ bản của công dân theo Hiến pháp',
    'Quyền bình đẳng của công dân trước pháp luật trong các lĩnh vực đời sống',
    'Pháp luật về kinh doanh và nghĩa vụ nộp thuế của doanh nghiệp',
    'Pháp luật về bảo vệ quyền lợi người tiêu dùng và trách nhiệm xã hội',
    'Pháp luật về lao động: Hợp đồng lao động, tiền lương và bảo hiểm',
    'Pháp luật về hôn nhân và gia đình: Nguyên tắc và quan hệ pháp lý',
    'Pháp luật về dân sự: Quyền sở hữu, thừa kế và nghĩa vụ hợp đồng',
    'Pháp luật hình sự: Khái niệm tội phạm, độ tuổi chịu trách nhiệm và hình phạt',
    'Pháp luật hành chính: Vi phạm hành chính và thủ tục xử phạt',
    'Pháp luật về bảo vệ môi trường và tài nguyên thiên nhiên',
    'Hội nhập kinh tế quốc tế và các hiệp định thương mại tự do (FTA)',
    'Pháp luật quốc tế về chủ quyền quốc gia và giải quyết tranh chấp',
    'Tổng hợp kỹ năng phân tích tình huống pháp luật và kinh tế vĩ mô',
  ],
};

// Teacher roster per subject
const TEACHER_MAP: Record<string, TeacherAssignment[]> = {
  Toán: [
    { id: 'gv_01', teacherName: 'Nguyễn Anh Tuấn', email: 'tuan.na@gmail.com', subject: 'Toán' },
    { id: 'gv_02', teacherName: 'Nguyễn Thị Thúy', email: 'thuy.nt@gmail.com', subject: 'Toán' },
  ],
  Lí: [
    { id: 'gv_03', teacherName: 'Vũ Thanh Thủy', email: 'thuy.vt@gmail.com', subject: 'Lí' },
    { id: 'gv_04', teacherName: 'Võ Tấn Hùng', email: 'hung.vt@gmail.com', subject: 'Lí' },
    { id: 'gv_05', teacherName: 'Lý Xuân Trưng', email: 'trung.lx@gmail.com', subject: 'Lí' },
  ],
  Hóa: [
    { id: 'gv_08', teacherName: 'Nguyễn Huy Hoàng', email: 'hoang.nh@gmail.com', subject: 'Hóa' },
    { id: 'gv_09', teacherName: 'Đỗ Thị Thu Phương', email: 'phuong.dtt@gmail.com', subject: 'Hóa' },
    { id: 'gv_10', teacherName: 'Hà Thị Thúy Hằng', email: 'hang.htt@gmail.com', subject: 'Hóa' },
  ],
  Sinh: [
    { id: 'gv_11', teacherName: 'Đàm Thị Vân', email: 'van.dtv@gmail.com', subject: 'Sinh' },
  ],
  'Tin học': [
    { id: 'gv_06', teacherName: 'Nguyễn Thị Giang', email: 'giang.nt@gmail.com', subject: 'Tin học' },
    { id: 'gv_07', teacherName: 'Lê Thị Mỹ Anh', email: 'anh.ltm@gmail.com', subject: 'Tin học' },
  ],
  'Ngữ văn': [
    { id: 'gv_12', teacherName: 'Huỳnh T.Tư Em', email: 'em.htt@gmail.com', subject: 'Ngữ văn' },
    { id: 'gv_13', teacherName: 'Trần Thị Thanh Hà', email: 'ha.ttt@gmail.com', subject: 'Ngữ văn' },
  ],
  Anh: [
    { id: 'gv_14', teacherName: 'Vũ Minh Hằng', email: 'hang.vm@gmail.com', subject: 'Anh' },
    { id: 'gv_15', teacherName: 'Nguyễn Thị Bích Thuận', email: 'thuan.ntb@gmail.com', subject: 'Anh' },
    { id: 'gv_16', teacherName: 'Bùi Thị Nhiệm', email: 'nhiem.bt@gmail.com', subject: 'Anh' },
  ],
  Sử: [
    { id: 'gv_17', teacherName: 'Võ Văn Dũng', email: 'vandungtpdn1976@gmail.com', subject: 'Sử' },
    { id: 'gv_18', teacherName: 'Hồ Thị Bắc', email: 'bac.htb@gmail.com', subject: 'Sử' },
  ],
  'Địa lí': [
    { id: 'gv_19', teacherName: 'Mai Thị Quỳ', email: 'quy.mt@gmail.com', subject: 'Địa lí' },
    { id: 'gv_20', teacherName: 'Lục Hữu Bằng', email: 'bang.lh@gmail.com', subject: 'Địa lí' },
  ],
  GDKTPL: [
    { id: 'gv_21', teacherName: 'Hà Thị Thanh Huyền', email: 'huyen.htt@gmail.com', subject: 'GDKTPL' },
  ],
};

// Daily schedule pattern (Monday = 2, Tuesday = 3, ..., Saturday = 7)
const DAY_SCHEDULE: Record<number, string[]> = {
  2: ['Toán', 'Lí'],
  3: ['Hóa', 'Toán', 'Anh', 'Sử', 'Tin học'],
  4: ['Ngữ văn', 'GDKTPL', 'Hóa', 'Lí'],
  5: ['Sinh', 'Địa lí', 'Anh', 'Tin học'],
  6: ['Toán', 'Lí', 'Sử', 'Hóa'],
  7: ['Địa lí', 'Anh', 'Ngữ văn'],
};

// Date calculation helper
function getDateString(weekNumber: number, dayOfWeek: number): string {
  const [y, m, d] = '2026-09-07'.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const daysOffset = (weekNumber - 1) * 7 + (dayOfWeek - 2);
  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + daysOffset);

  const day = String(targetDate.getDate()).padStart(2, '0');
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const year = targetDate.getFullYear();
  return `${day}/${month}/${year}`;
}

// Generate data for weeks 1 through 18
for (let w = 1; w <= 18; w++) {
  // If Week 5 already has user's rich curated entries, keep it intact
  const weekFilePath = path.resolve(WEEKS_DIR, `week_${w}.json`);
  if (w === 5 && fs.existsSync(weekFilePath)) {
    console.log(`Week 5 already preserved.`);
    continue;
  }

  const weekEntries: LogPeriodEntry[] = [];
  const startPpctBase = (w - 1) * 4 + 1; // e.g. W1: 1..4, W2: 5..8, W3: 9..12...

  for (let day = 2; day <= 7; day++) {
    const subjectsForDay = DAY_SCHEDULE[day] || ['Toán'];
    const dateStr = getDateString(w, day);

    subjectsForDay.forEach((subject, clusterIdx) => {
      const clusterNumber = clusterIdx + 1;
      const lessonTopics = CURRICULUM[subject] || ['Chuyên đề bồi dưỡng nâng cao'];
      const lessonTitle = lessonTopics[(w - 1) % lessonTopics.length];

      const availableTeachers = TEACHER_MAP[subject] || [
        { id: 'gv_def', teacherName: 'Võ Văn Dũng', email: 'vandungtpdn1976@gmail.com', subject },
      ];
      const teacher = availableTeachers[(w + day + clusterIdx) % availableTeachers.length];

      // 5 periods per cluster
      for (let p = 1; p <= 5; p++) {
        const isTaught = p <= 4; // periods 1-4 are taught, period 5 left for self-study/writing
        const ppctNumber = isTaught ? String(startPpctBase + p - 1) : '';

        // Some realistic absences once in a while
        let absentCount = 0;
        let absentStudents = '';
        if (isTaught && (w + day + p) % 17 === 0) {
          absentCount = 1;
          absentStudents = 'Nguyễn Bảo An (Có phép)';
        } else if (isTaught && (w * day + p) % 23 === 0) {
          absentCount = 1;
          absentStudents = 'Trần Quốc Anh (Ốm)';
        }

        weekEntries.push({
          id: `w${w}_d${day}_c${clusterNumber}_p${p}`,
          weekNumber: w,
          dayOfWeek: day,
          dateStr,
          clusterIndex: clusterNumber,
          period: p,
          subject: isTaught ? subject : '',
          ppctLesson: ppctNumber,
          absentCount,
          absentStudents,
          lessonTitle: isTaught ? lessonTitle : '',
          teacherSignature: isTaught ? teacher.teacherName : '',
          teacherEmail: isTaught ? teacher.email : '',
          updatedAt: `${dateStr} 17:00`,
        });
      }
    });
  }

  fs.writeFileSync(weekFilePath, JSON.stringify(weekEntries, null, 2), 'utf-8');
  console.log(`Generated Week ${w}: ${weekEntries.length} entries.`);
}

console.log('Successfully seeded all 18 weeks with complete teacher lesson entries!');
