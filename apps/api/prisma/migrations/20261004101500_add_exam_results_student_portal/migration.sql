-- CreateTable
CREATE TABLE "exam_results" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "marks" DECIMAL(6,2) NOT NULL,
    "maxMarks" DECIMAL(6,2) NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,
    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_examId_studentId_subjectId_key" ON "exam_results"("examId", "studentId", "subjectId");
CREATE INDEX "exam_results_studentId_idx" ON "exam_results"("studentId");
CREATE INDEX "exam_results_examId_idx" ON "exam_results"("examId");

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
