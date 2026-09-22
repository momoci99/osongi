/**
 * 등급명을 본 등급과 괄호 속 세부 구분으로 나눈다.
 * "3등품(생장정지품)" → { main: "3등품", qualifier: "생장정지품" }
 * 좁은 화면에서 등급명이 임의 위치에서 끊기지 않도록 두 줄 표기에 쓴다.
 */
const splitGradeLabel = (label: string) => {
  const match = label.match(/^(.+?)\((.+)\)$/);
  return match
    ? { main: match[1], qualifier: match[2] }
    : { main: label, qualifier: null };
};

export default splitGradeLabel;
