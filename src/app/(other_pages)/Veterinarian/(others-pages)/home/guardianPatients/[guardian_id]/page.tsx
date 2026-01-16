import Header from '@/components/common/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
interface Guardian {
  id: string;
  name: string;
  idNumber: string;
  avatarUrl?: string;
}

function page() {
  const guardians: Guardian[] = [
    {
      id: "1",
      name: "Emily",
      idNumber: "111.222.333",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    },
    {
      id: "2",
      name: "Zack Knight",
      idNumber: "111.222.333",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    {
      id: "3",
      name: "Zack Knight",
      idNumber: "111.222.333",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
  ];
  return (
    <>
      <div className="px-4 mt-4 flex flex-col grid grid-cols-1 gap-2">
        <Header title="View Pets" />
        {
          guardians.map((guardian) => (
            <div
              key={guardian.id}
              className="bg-[#F5F6F6] rounded-2xl px-3 p-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={guardian.avatarUrl} alt={guardian.name} />
                    <AvatarFallback className="bg-muted text-black text-sm">
                      {guardian.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground text-[15px]">{guardian.name}</h3>
                    <p className="text-sm text-black/70">ID: {guardian.idNumber}</p>
                  </div>
                </div>
                <button
                  // onClick={() => onGuardianClick?.(guardian.id)}
                  className="text-black hover:text-foreground transition-colors p-1"
                >
                  <ChevronRight className="h-5 w-5 text-primary" />
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </>
  )
}

export default page
