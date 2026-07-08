const test = require("node:test");
const assert = require("node:assert/strict");

const parentProfileApi = require("../api/parent-profile.js");
const profileContactApi = require("../api/profile-contact.js");

test("parent profile api helpers create stable anonymous profile ids", () => {
  const id = parentProfileApi.__test.createProfileId();

  assert.match(id, /^yp_[a-z0-9]{10,18}$/);
  assert.equal(parentProfileApi.__test.normalizeProfileId(" yp_abc123XYZ "), "yp_abc123xyz");
  assert.equal(parentProfileApi.__test.normalizeProfileId("bad id"), "");
});

test("parent profile api normalizes saved payloads", () => {
  const payload = parentProfileApi.__test.normalizeProfilePayload({
    answers: { parent_age: "80_plus" },
    result: { type: "高风险照护型父母画像", priorities: ["防跌风险"] },
    actionList: ["先处理浴室"]
  });

  assert.equal(payload.answers.parent_age, "80_plus");
  assert.equal(payload.result.type, "高风险照护型父母画像");
  assert.deepEqual(payload.action_list, ["先处理浴室"]);
});

test("profile contact api normalizes lead payloads", () => {
  const payload = profileContactApi.__test.normalizeContactPayload({
    profile_id: " YP_ABC123XYZ ",
    name: " 张三 ",
    phone_or_wechat: " wx-123 ",
    city: " 长沙 ",
    note: " 希望先看下一步 "
  });

  assert.equal(payload.profile_id, "yp_abc123xyz");
  assert.equal(payload.name, "张三");
  assert.equal(payload.phone_or_wechat, "wx-123");
  assert.equal(payload.city, "长沙");
  assert.equal(payload.note, "希望先看下一步");
});
