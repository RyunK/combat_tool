import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const emptyStat = () => ({ name: "", default: "" });
const emptyStatus = () => ({
  name: "",
  target: "",
  mode: "flat",
  value: "",
  duration: "",
  source: "",
});

export default function GroupForm() {
  const { gid } = useParams(); // /groups/:gid/edit 라우트에서 사용, 새 그룹이면 undefined
  const navigate = useNavigate();
  const isEdit = Boolean(gid);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [statSchema, setStatSchema] = useState([emptyStat()]);
  const [statuses, setStatuses] = useState([emptyStatus()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 수정 모드면 기존 그룹 데이터를 불러와 폼에 채워 넣는다
  useEffect(() => {
    if (!isEdit) return;
    fetch(`/api/groups/${gid}`)
      .then((res) => {
        if (!res.ok) throw new Error("그룹을 불러오지 못했습니다");
        return res.json();
      })
      .then((group) => {
        setName(group.name ?? "");
        setCategory(group.category ?? "");
        setStatSchema(
          group.stat_schema?.length
            ? group.stat_schema.map((s) => ({ name: s.name, default: s.default }))
            : [emptyStat()]
        );
        setStatuses(
          group.statuses?.length
            ? group.statuses.map((s) => ({
                name: s.name,
                target: s.target,
                mode: s.mode,
                value: s.value,
                duration: s.duration ?? "",
                source: s.source ?? "",
              }))
            : [emptyStatus()]
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [gid, isEdit]);

  // ---------------------------------------------------- 동적 행 조작

  const updateStat = (idx, field, value) => {
    setStatSchema((rows) =>
      rows.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };
  const addStatRow = () => setStatSchema((rows) => [...rows, emptyStat()]);
  const removeStatRow = (idx) =>
    setStatSchema((rows) => rows.filter((_, i) => i !== idx));

  const updateStatus = (idx, field, value) => {
    setStatuses((rows) =>
      rows.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };
  const addStatusRow = () => setStatuses((rows) => [...rows, emptyStatus()]);
  const removeStatusRow = (idx) =>
    setStatuses((rows) => rows.filter((_, i) => i !== idx));

  // ---------------------------------------------------- 저장

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      id: gid,
      name,
      category: category || null,
      stat_schema: statSchema
        .filter((s) => s.name.trim())
        .map((s) => ({ name: s.name, default: Number(s.default) || 0 })),
      statuses: statuses
        .filter((s) => s.name.trim())
        .map((s) => ({
          name: s.name,
          target: s.target,
          mode: s.mode,
          value: Number(s.value) || 0,
          duration: s.duration === "" ? null : Number(s.duration),
          source: s.source || null,
        })),
    };

    try {
      const res = await fetch(isEdit ? `/api/groups/${gid}` : "/api/groups", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다");
      navigate("/groups");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="hint">불러오는 중...</p>;

  return (
    <div>
      <h2>{isEdit ? "그룹 수정" : "새 그룹"}</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <h3>그룹 이름</h3>
        <div className="form-default-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <h3>분류</h3>
        <div className="form-default-row">
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="진영/포지션/종족 등"
          />
        </div>

        <h3>요구 스탯</h3>
        <p className="hint">
          이 그룹에 속한 캐릭터가 가져야 할 스탯과 기본값입니다. 예: 탱커 그룹 → HP(기본
          150), DEF(기본 10)
        </p>
        {statSchema.map((row, idx) => (
          <div
            key={idx}
            style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}
          >
            <input
              type="text"
              placeholder="스탯 이름 (예: HP)"
              value={row.name}
              onChange={(e) => updateStat(idx, "name", e.target.value)}
            />
            <input
              type="number"
              step="any"
              placeholder="기본값"
              value={row.default}
              onChange={(e) => updateStat(idx, "default", e.target.value)}
            />
            <button
              type="button"
              className="btn btn-red"
              onClick={() => removeStatRow(idx)}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="btn-row" style={{ marginBottom: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={addStatRow}>
            + 요구 스탯 추가
          </button>
        </div>

        <h3>그룹 전체 상태</h3>
        <p className="hint">
          이 그룹 소속 캐릭터 전원에게 자동으로 적용되는 상태입니다. 예: 탱커는 HP +20%
        </p>
        {statuses.map((row, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="상태 이름 (예: 탱커 체력보정)"
              value={row.name}
              onChange={(e) => updateStatus(idx, "name", e.target.value)}
            />
            <input
              type="text"
              placeholder="대상 스탯 (예: HP)"
              value={row.target}
              onChange={(e) => updateStatus(idx, "target", e.target.value)}
            />
            <select
              value={row.mode}
              onChange={(e) => updateStatus(idx, "mode", e.target.value)}
            >
              <option value="flat">flat(고정값)</option>
              <option value="percent">percent(%)</option>
            </select>
            <input
              type="number"
              step="any"
              placeholder="값"
              value={row.value}
              onChange={(e) => updateStatus(idx, "value", e.target.value)}
            />
            <input
              type="number"
              placeholder="지속턴(비우면 무한)"
              value={row.duration}
              onChange={(e) => updateStatus(idx, "duration", e.target.value)}
            />
            <input
              type="text"
              placeholder="출처(선택)"
              value={row.source}
              onChange={(e) => updateStatus(idx, "source", e.target.value)}
            />
            <button
              type="button"
              className="btn btn-red"
              onClick={() => removeStatusRow(idx)}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="btn-row" style={{ marginBottom: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={addStatusRow}>
            + 그룹 상태 추가
          </button>
        </div>

        <div className="btn-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/groups")}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
