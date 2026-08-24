// 상태(버프/디버프) 관련 공용 상수
// GroupForm.js, CharactersForm.js에서 공통으로 사용

export const emptyStatus = () => ({
  name: "",
  target: "",         // 대상
  value: "",          // 값
  mode: "fixed",       // 'fixed' | 'percent'
  duration: "",        // 지속시간 (빈 값 = 무한)
  timing: "once",  // 적용 시점
  source: "",          // 상태를 건 주체 (없어도 됨)
  memo: "",            // 메모 (없어도 됨)
});

export const STATUS_MODE_OPTIONS = [
  { value: 'fixed', label: '고정값' },
  { value: 'percent', label: '퍼센트' },
];

export const STATUS_TIMING_OPTIONS = [
  { value: 'once', label: '한 번만' },
  { value: 'every', label: '매번' },
];

// 이름을 추후 드롭박스로 전환할 때를 대비한 프리셋 테이블.
export const STATUS_NAME_PRESETS = {
  // 예시: '기절': { target: '적 전체', mode: 'fixed', duration: '1' },
};