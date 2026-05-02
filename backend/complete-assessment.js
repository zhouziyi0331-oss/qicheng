const axios = require('axios');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5OTk5OTk5OS05OTk5LTk5OTktOTk5OS05OTk5OTk5OTk5OTkiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc3NjE4NjU5NywiZXhwIjoxNzc2MTg3NDk3LCJqdGkiOiI1Y2MyYmRlNzljYjNiNWU5ZGRlMmUyNjM5N2ExYzExMS1hIn0.HTSYVzE8dx6-WC9oNAlvvrzMUvtiHKgJ_dxClB4Zb_0";
const BASE_URL = "http://localhost:3000/api/v1/opc-v2";
const ASSESSMENT_ID = "e3b59008-19bb-400f-b2b4-6e723be61014";

const questions = [
  { id: "ae30d191-e3cb-49e3-a0f8-bde1834208c2", type: "choice", answer: { selectedOption: "B" } },
  { id: "8a174803-dde9-4c6c-8de0-08dbff48f3b3", type: "choice", answer: { selectedOption: "A" } },
  { id: "a37f8d42-1c4c-4825-9bf6-ea1a7a0d77b1", type: "choice", answer: { selectedOption: "D" } },
  { id: "0fb51d05-5bc0-4b89-b4cc-42aa2b7af399", type: "choice", answer: { selectedOption: "C" } },
  { id: "f4db622c-441b-43e8-b4b3-a5e3427a6f13", type: "choice", answer: { selectedOption: "B" } },
  { id: "f8d42f19-3b45-4169-a924-9b4011a0299d", type: "choice", answer: { selectedOption: "A" } },
  { id: "7faf153b-a795-410f-97a8-712e5f54c814", type: "choice", answer: { selectedOption: "B" } },
  { id: "2dbb5cbe-e35e-4375-aaf2-f76b7c026f83", type: "choice", answer: { selectedOption: "A" } },
  { id: "a2e5de7e-c073-47b7-a5d8-e54e816e172d", type: "choice", answer: { selectedOption: "B" } },
  { id: "5393ab56-e426-4b31-b9ab-b817a3788658", type: "choice", answer: { selectedOption: "B" } },
  { id: "55edbfd0-ead3-4aa1-bc80-af3970b6be77", type: "choice", answer: { selectedOption: "B" } },
  { id: "1de1c188-c13f-4c45-8bc1-12cd974c6088", type: "choice", answer: { selectedOption: "A" } },
  { id: "9b1718af-8539-4479-93ac-fe04de1b16c0", type: "choice", answer: { selectedOption: "A" } },
  { id: "068c36f4-6bf5-46b6-93ec-e6ddc77b5fef", type: "choice", answer: { selectedOption: "C" } },
  { id: "4c40d97e-a968-4e5e-a6df-3761b29dd34d", type: "choice", answer: { selectedOption: "B" } },
  { id: "f3353d0f-a6a8-42e5-9f0c-77d8dacc4f83", type: "choice", answer: { selectedOption: "C" } },
  { id: "67e9ae18-82e8-4945-9042-fec20cc79e28", type: "choice", answer: { selectedOption: "A" } },
  { id: "e585e4b4-bf05-48ef-bb32-d626932f84a4", type: "choice", answer: { selectedOption: "A" } },
  { id: "020b67b0-b437-4267-8613-5a0f7be59bed", type: "choice", answer: { selectedOption: "B" } },
  { id: "8dd95445-5c56-4a85-a51d-446b726b3275", type: "choice", answer: { selectedOption: "C" } },
  { id: "526c72e7-3ff0-4043-bc12-6677f7553c62", type: "choice", answer: { selectedOption: "B" } },
  { id: "d9e3e9aa-6a77-4e72-823d-f65daa53fff3", type: "choice", answer: { selectedOption: "C" } },
  { id: "d45a4117-6701-48f8-9499-2f0232a22805", type: "choice", answer: { selectedOption: "C" } },
  { id: "4ae3a267-07a5-49c4-b20d-1a8eab537367", type: "choice", answer: { selectedOption: "A" } },
  { id: "dd1fb230-e44a-498f-9cfe-c455f73a8c17", type: "choice", answer: { selectedOption: "B" } },
  { id: "db1aeee5-8fa8-4831-b519-3e4d0f0c98d0", type: "choice", answer: { selectedOption: "C" } },
  { id: "c81b1dc3-08a0-4068-a7e2-f84258f1ee14", type: "choice", answer: { selectedOption: "B" } },
  { id: "134005c8-ecc3-487b-af4a-ba56f749b18b", type: "choice", answer: { selectedOption: "D" } },
  { id: "ef613939-c384-4a68-bcef-26d8e78d70f8", type: "choice", answer: { selectedOption: "C" } },
  { id: "29048b28-a3a8-4dc3-a49a-f04db7424837", type: "choice", answer: { selectedOption: "C" } },
  { id: "b7f2ccce-0cd4-4959-a483-32e2b84b83c2", type: "choice", answer: { selectedOption: "A" } },
  { id: "2cdd5e62-156c-4e6f-9a1a-4dd45537637c", type: "choice", answer: { selectedOption: "C" } },
  { id: "0dffb785-9e00-4291-a227-818f22932d84", type: "choice", answer: { selectedOption: "C" } },
  { id: "1f5dd944-5287-4500-8b5f-33c162dac2ab", type: "choice", answer: { selectedOption: "B" } },
  { id: "a41ff08a-ae94-4080-a8a7-51bce7a78017", type: "choice", answer: { selectedOption: "B" } }
];

async function completeAssessment() {
  console.log('开始提交剩余答案...\n');

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    try {
      await axios.post(`${BASE_URL}/answer`, {
        assessmentId: ASSESSMENT_ID,
        questionId: q.id,
        answer: q.answer
      }, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      console.log(`✓ 第 ${i + 4} 题已提交`);
    } catch (err) {
      console.error(`✗ 第 ${i + 4} 题提交失败:`, err.response?.data || err.message);
    }
  }

  console.log('\n完成测评...');
  try {
    const result = await axios.post(`${BASE_URL}/${ASSESSMENT_ID}/complete`, {}, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    console.log('\n✓ 测评已完成！');
    console.log(JSON.stringify(result.data, null, 2));
  } catch (err) {
    console.error('✗ 完成测评失败:', err.response?.data || err.message);
  }
}

completeAssessment();
