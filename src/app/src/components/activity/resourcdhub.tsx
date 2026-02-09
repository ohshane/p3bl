import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { Session } from "@/types";

interface ResourcdHubProps {
  session: Session;
}

export function ResourcdHub({ session }: ResourcdHubProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderGuide = () => (
    <div className="space-y-2 text-sm text-foreground/80 leading-relaxed">
      {session.guide.split("\n").map((paragraph, index) => {
        if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
          return (
            <p key={index} className="text-sm text-foreground">
              {paragraph.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (paragraph.startsWith("- ")) {
          return (
            <li key={index} className="ml-4 list-disc">
              {paragraph.substring(2)}
            </li>
          );
        }
        if (paragraph.trim()) {
          return <p key={index}>{paragraph}</p>;
        }
        return <br key={index} />;
      })}
    </div>
  );

  return (
    <>
      <Card className="max-h-[390px] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Guide</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </CardHeader>
      <CardContent className="space-y-4 overflow-auto pr-4 scrollbar-none">
          <div>
            <p className="text-xs text-muted-foreground">Title</p>
            <p className="text-sm text-foreground mt-1">{session.title}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Objective</p>
            <p className="text-sm text-foreground mt-1">
              {session.topic || "No objective provided"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Guide</p>
            <div className="text-sm text-foreground mt-1">{renderGuide()}</div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent
          className="max-w-4xl"
          overlayClassName="backdrop-blur-sm"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-sm">Guide</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Title</p>
              <p className="text-sm text-foreground mt-1">{session.title}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Objective</p>
              <p className="text-sm text-foreground/80 mt-1">
                {session.topic || "No objective provided"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Guide</p>
              {renderGuide()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
