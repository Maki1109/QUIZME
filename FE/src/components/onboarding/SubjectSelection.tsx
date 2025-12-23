import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { BookOpen, Calculator, Atom, Beaker, Globe, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface SubjectSelectionProps {
  onComplete: (subjects: string[]) => void;
  onBack: () => void;
}

const subjects = [
  {
    id: 'math',
    name: 'Toán',
    icon: Calculator,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'physics',
    name: 'Vật Lý',
    icon: Atom,
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-300',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'chemistry',
    name: 'Hóa Học',
    icon: Beaker,
    color: 'from-green-500 to-emerald-500',
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50',
  },
  {
    id: 'literature',
    name: 'Ngữ Văn',
    icon: BookOpen,
    color: 'from-orange-500 to-red-500',
    borderColor: 'border-orange-300',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'english',
    name: 'Tiếng Anh',
    icon: Globe,
    color: 'from-teal-500 to-cyan-500',
    borderColor: 'border-teal-300',
    bgColor: 'bg-teal-50',
  },
];

export function SubjectSelection({ onComplete, onBack }: SubjectSelectionProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleContinue = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedSubjects.length > 0) {
      onComplete(selectedSubjects);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12"
      >
        <div className="inline-block mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-orange-700 mb-3">Bạn Muốn Học Môn Gì?</h1>
        <p className="text-gray-600 text-lg">
          Chọn các môn học bạn quan tâm. Bạn có thể thêm môn khác sau.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {subjects.map((subject, index) => {
          const isSelected = selectedSubjects.includes(subject.id);
          const Icon = subject.icon;

          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? `border-4 ${subject.borderColor} shadow-2xl scale-105`
                    : 'border-2 border-gray-200 hover:border-orange-200 hover:shadow-lg'
                }`}
                onClick={() => toggleSubject(subject.id)}
              >
                <CardContent className="p-6 text-center">
                  <motion.div
                    animate={{
                      scale: isSelected ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className={`w-20 h-20 bg-gradient-to-br ${subject.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-gray-800 mb-2">{subject.name}</h3>
                  <div className="flex justify-center">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? `${subject.borderColor} bg-gradient-to-br ${subject.color}`
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 bg-white rounded-full"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between"
      >
        <Button
          onClick={onBack}
          variant="outline"
          className="px-8 py-6 text-lg border-2 border-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </Button>

        <Button
          onClick={handleContinue}
          disabled={selectedSubjects.length === 0}
          className="px-12 py-6 text-lg bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedSubjects.length === 0
            ? 'Vui lòng chọn ít nhất 1 môn'
            : `Tiếp tục với ${selectedSubjects.length} môn →`}
        </Button>
      </motion.div>
    </div>
  );
}
