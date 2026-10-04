'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { Card, ErrorText } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { AcademicYear } from '../../lib/types';

type Exam = { id: string; name: string; startDate: string; endDate: string; status: 'DRAFT'|'SCHEDULED'|'PUBLISHED'|'CLOSED'; academicYear: AcademicYear; _count: { results: number } };
type Report = { student: Student; results: Array<{ exam:{name:string;startDate:string;status:string}; subject:{name:string}; marks:string|number; maxMarks:string|number; grade:string|null; remarks:string|null }> };
type Student = { id: string; firstName: string; lastName: string; rollNumber: string | null };
type Subject = { id: string; name: string };

export default function ExamsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState('Term 1');
  const [yearId, setYearId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [marks, setMarks] = useState('');
  const [grade, setGrade] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  async function load() {
    const [y, e, s, sub] = await Promise.all([
      api.get<AcademicYear[]>('/academic-years'),
      api.get<Exam[]>('/exams'),
      api.get<Student[]>('/students'),
      api.get<Subject[]>('/subjects'),
    ]);
    setYears(y); setExams(e); setStudents(s); setSubjects(sub);
    if (!yearId) setYearId(y.find((x) => x.isCurrent)?.id ?? y[0]?.id ?? '');
    if (!studentId) setStudentId(s[0]?.id ?? '');
    if (!subjectId) setSubjectId(sub[0]?.id ?? '');
  }
  useEffect(() => { void load().catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load exams.')); }, []);

  async function createExam(e: FormEvent) {
    e.preventDefault(); setError(null); setSuccess(null);
    try {
      await api.post('/exams', { name, academicYearId: yearId, startDate: '2026-09-15', endDate: '2026-09-25' });
      setSuccess('Exam created.'); await load();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to create exam.'); }
  }

  async function publishExam(id:string){ try { await api.patch(`/exams/${id}`, { status: 'PUBLISHED' }); setSuccess('Exam published.'); await load(); } catch(err){ setError(err instanceof ApiError ? err.message : 'Failed to publish exam.'); }}

  async function printReport(){ if(!studentId) return; try { const r=await api.get<Report>(`/exams/report?studentId=${encodeURIComponent(studentId)}${exams[0]?`&examId=${encodeURIComponent(exams[0].id)}`:''}`); setReport(r); setTimeout(()=>window.print(),150); } catch(err){setError(err instanceof ApiError?err.message:'Failed to load report card.');}}

  async function saveResult(e: FormEvent) {
    e.preventDefault(); setError(null); setSuccess(null);
    const exam = exams[0];
    if (!exam) { setError('Create an exam first.'); return; }
    try {
      const maxMarks = 100;
      await api.post('/exams/results', { examId: exam.id, studentId, subjectId, marks: Number(marks), maxMarks, grade: grade || undefined });
      setSuccess('Result saved.'); setMarks(''); setGrade(''); await load();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to save result.'); }
  }

  return <AppShell>
    <div className="mb-8">
      <div className="font-mono text-xs uppercase tracking-widest text-margin mb-2">Academics</div>
      <h1 className="font-display text-4xl uppercase">Exams & report cards</h1>
      <p className="text-ink-soft mt-2">Create exams, publish results and produce a print-ready report card.</p>
    </div>
    <ErrorText>{error}</ErrorText>
    {success && <p className="text-green-700 text-sm mb-4">{success}</p>}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card>
        <h2 className="font-display text-2xl uppercase mb-4">Create exam</h2>
        <form onSubmit={createExam} className="space-y-3">
          <label className="block text-sm">Name<input className="mt-1 w-full border border-paper-line bg-paper px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} required /></label>
          <label className="block text-sm">Academic year<select className="mt-1 w-full border border-paper-line bg-paper px-3 py-2" value={yearId} onChange={(e)=>setYearId(e.target.value)}>{years.map(y=><option key={y.id} value={y.id}>{y.name}{y.isCurrent?' — Current':''}</option>)}</select></label>
          <button className="bg-board text-chalk px-4 py-2 text-sm font-semibold">Create exam</button>
        </form>
      </Card>
      <Card>
        <h2 className="font-display text-2xl uppercase mb-4">Record result</h2>
        <form onSubmit={saveResult} className="space-y-3">
          <label className="block text-sm">Student<select className="mt-1 w-full border border-paper-line bg-paper px-3 py-2" value={studentId} onChange={(e)=>setStudentId(e.target.value)}>{students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName} {s.rollNumber ? `· ${s.rollNumber}` : ''}</option>)}</select></label>
          <label className="block text-sm">Subject<select className="mt-1 w-full border border-paper-line bg-paper px-3 py-2" value={subjectId} onChange={(e)=>setSubjectId(e.target.value)}>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="block text-sm">Marks / 100<input type="number" min="0" max="100" className="mt-1 w-full border border-paper-line bg-paper px-3 py-2" value={marks} onChange={(e)=>setMarks(e.target.value)} required /></label>
          <label className="block text-sm">Grade (optional)<input className="mt-1 w-full border border-paper-line bg-paper px-3 py-2" value={grade} onChange={(e)=>setGrade(e.target.value)} /></label>
          <div className="flex gap-2"><button className="bg-board text-chalk px-4 py-2 text-sm font-semibold">Save result</button><button type="button" onClick={printReport} className="border border-paper-line px-4 py-2 text-sm">Print report card</button></div>
        </form>
      </Card>
    </div>
    {report&&<div className="print:block"><Card className="mt-5"><div className="flex justify-between"><div><div className="font-display text-2xl uppercase">Report card</div><div className="text-sm text-ink-soft">{report.student.firstName} {report.student.lastName}</div></div><div className="text-xs font-mono">KAKSAM</div></div><table className="w-full mt-5 text-sm"><thead><tr className="border-b border-paper-line text-left"><th className="py-2">Exam</th><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead><tbody>{report.results.map((r,i)=><tr key={i} className="border-b border-paper-line"><td className="py-2">{r.exam.name}</td><td>{r.subject.name}</td><td>{r.marks} / {r.maxMarks}</td><td>{r.grade??'—'}</td></tr>)}</tbody></table></Card></div>}
    <Card className="mt-5"><h2 className="font-display text-2xl uppercase mb-4">Exams</h2><div className="space-y-2">{exams.map(x=><div key={x.id} className="border-t border-paper-line pt-3 flex justify-between"><span>{x.name} · {x.academicYear.name}</span><div className="flex items-center gap-3"><span className="font-mono text-xs text-ink-soft">{x.status} · {x._count.results} results</span>{x.status!=='PUBLISHED'&&<button onClick={()=>publishExam(x.id)} className="text-xs underline">Publish</button>}</div></div>)}{exams.length===0&&<p className="text-sm text-ink-soft">No exams yet.</p>}</div></Card>
  </AppShell>;
}
