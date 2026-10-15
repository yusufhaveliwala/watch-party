import React, { useState } from 'react';
import { 
  Vote, 
  Plus, 
  CheckCircle2, 
  Trophy, 
  X, 
  Clock, 
  Trash2,
  Lock
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { Poll } from '../types/watchParty';

export const PollsPanel: React.FC = () => {
  const { room, user, isHost, sendPollAction } = useRoom();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const polls: Poll[] = room?.polls || [];

  const handleVote = (pollId: string, optionId: string) => {
    sendPollAction('vote', { pollId, optionId });
  };

  const handleClosePoll = (pollId: string) => {
    sendPollAction('close', { pollId });
  };

  const handleAddOptionField = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleRemoveOptionField = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim() || cleanOptions.length < 2) return;

    sendPollAction('create', {
      poll: {
        question: question.trim(),
        options: cleanOptions
      }
    });

    setQuestion('');
    setOptions(['', '']);
    setShowCreateModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-[#E1EBE2] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E1EBE2] flex items-center justify-between bg-[#F8FAF6]">
        <div>
          <span className="text-sm font-bold text-[#20382B]">Group Polls & Voting</span>
          <span className="text-xs text-[#6B7C70] ml-1.5">
            ({polls.filter(p => p.isActive).length} active)
          </span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4C956C] hover:bg-[#3d7a57] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Poll</span>
        </button>
      </div>

      {/* Polls List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[260px] max-h-[380px] lg:max-h-[500px]">
        {polls.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6B7C70]">
            <Vote className="w-8 h-8 text-[#A8D5BA] mb-2" />
            <p className="text-xs font-semibold text-[#20382B]">No active polls</p>
            <p className="text-[11px] text-[#6B7C70] mt-0.5">
              Launch a poll to let everyone vote on what to stream next.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 px-3 py-1.5 rounded-lg bg-[#DDF3E4] text-[#20382B] text-xs font-medium hover:bg-[#A8D5BA] transition-colors"
            >
              Start First Poll
            </button>
          </div>
        ) : (
          polls.map((poll) => {
            const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
            const userVotedOptionId = poll.options.find(opt => opt.votes.includes(user.id))?.id;
            const canClose = isHost || poll.createdBy === user.id;

            return (
              <div
                key={poll.id}
                className="p-3.5 rounded-xl border border-[#E1EBE2] bg-white shadow-xs space-y-3"
              >
                {/* Poll Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#20382B] leading-snug">
                      {poll.question}
                    </h4>
                    <p className="text-[10px] text-[#6B7C70] mt-0.5">
                      By {poll.createdByName} · {totalVotes} total votes
                    </p>
                  </div>
                  {poll.isActive ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-[#4C956C] bg-[#DDF3E4] px-2 py-0.5 rounded-full">
                        Live
                      </span>
                      {canClose && (
                        <button
                          onClick={() => handleClosePoll(poll.id)}
                          className="text-[10px] text-[#6B7C70] hover:text-[#20382B] underline"
                          title="End poll and declare winner"
                        >
                          End
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0">
                      Ended
                    </span>
                  )}
                </div>

                {/* Winning Option Banner if closed */}
                {!poll.isActive && poll.winningOptionId && (
                  <div className="p-2 rounded-lg bg-[#DDF3E4] border border-[#A8D5BA] flex items-center gap-2 text-xs text-[#20382B]">
                    <Trophy className="w-4 h-4 text-[#4C956C] shrink-0" />
                    <span>
                      Winner: <strong>{poll.options.find(o => o.id === poll.winningOptionId)?.text}</strong>
                    </span>
                  </div>
                )}

                {/* Options list with progress bars */}
                <div className="space-y-1.5">
                  {poll.options.map((option) => {
                    const count = option.votes.length;
                    const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const isUserChoice = userVotedOptionId === option.id;
                    const isWinner = !poll.isActive && poll.winningOptionId === option.id;

                    return (
                      <button
                        key={option.id}
                        disabled={!poll.isActive}
                        onClick={() => handleVote(poll.id, option.id)}
                        className={`w-full relative overflow-hidden rounded-lg border text-left p-2.5 transition-all cursor-pointer disabled:cursor-default ${
                          isUserChoice
                            ? 'border-[#4C956C] bg-[#DDF3E4]/30'
                            : 'border-[#E1EBE2] hover:border-[#A8D5BA] bg-white'
                        }`}
                      >
                        {/* Fill progress bar */}
                        <div
                          style={{ width: `${percent}%` }}
                          className={`absolute top-0 bottom-0 left-0 opacity-20 pointer-events-none transition-all duration-500 ${
                            isWinner ? 'bg-amber-400' : 'bg-[#4C956C]'
                          }`}
                        />

                        <div className="relative flex items-center justify-between text-xs z-10">
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              isUserChoice ? 'border-[#4C956C] bg-[#4C956C]' : 'border-zinc-300'
                            }`}>
                              {isUserChoice && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span className={`font-medium ${isUserChoice ? 'text-[#20382B] font-semibold' : 'text-[#20382B]'}`}>
                              {option.text}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-[#6B7C70] tabular-nums shrink-0 ml-2">
                            {count} ({percent}%)
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePoll}
            className="bg-white rounded-2xl border border-[#E1EBE2] w-full max-w-md shadow-xl overflow-hidden p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-[#E1EBE2] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#20382B]">Create Group Poll</h3>
                <p className="text-xs text-[#6B7C70]">Ask room members to vote</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#20382B]">Question</label>
              <input
                type="text"
                placeholder="e.g. Which movie should we watch next?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                className="text-xs px-3 py-2 rounded-lg border border-[#E1EBE2] focus:outline-none focus:border-[#4C956C] text-[#20382B]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#20382B]">Options</label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    required
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#E1EBE2] focus:outline-none focus:border-[#4C956C] text-[#20382B]"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOptionField(idx)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {options.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOptionField}
                  className="text-xs font-medium text-[#4C956C] hover:underline self-start mt-1"
                >
                  + Add another option
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1EBE2]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B7C70] hover:bg-[#F8FAF6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#4C956C] hover:bg-[#3d7a57] text-white transition-colors"
              >
                Launch Poll
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
