'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, List, ChevronRight, SkipForward, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { 
  SETUP_STEPS, 
  getSetupStep, 
  getNextStep, 
  generateComponentsFromAnswers,
  type PropulsionType,
  COMPONENT_TEMPLATES,
} from '@/lib/component-templates';

interface BoatSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
  boatName: string;
  onComplete: () => void;
}

type WizardMode = 'select' | 'chat' | 'form';

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  options?: { value: string; label: string; icon?: string }[];
  stepId?: string;
}

export function BoatSetupWizard({ 
  isOpen, 
  onClose, 
  boatId, 
  boatName,
  onComplete 
}: BoatSetupWizardProps) {
  const [mode, setMode] = useState<WizardMode>('select');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentStepId, setCurrentStepId] = useState('propulsion_type');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Initialize chat mode with first question
  useEffect(() => {
    if (mode === 'chat' && chatMessages.length === 0) {
      const firstStep = getSetupStep('propulsion_type');
      if (firstStep) {
        setChatMessages([
          {
            id: '1',
            type: 'bot',
            content: `Let's set up ${boatName}! 🚤`,
          },
          {
            id: '2',
            type: 'bot',
            content: firstStep.question,
            options: firstStep.options,
            stepId: firstStep.id,
          },
        ]);
      }
    }
  }, [mode, boatName, chatMessages.length]);
  
  if (!isOpen) return null;
  
  const handleChatAnswer = (stepId: string, value: string, label: string) => {
    // Add user's answer to chat
    setChatMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'user',
        content: label,
      },
    ]);
    
    // Save answer
    setAnswers(prev => ({ ...prev, [stepId]: value }));
    
    // Get next step
    const nextStepId = getNextStep(stepId, value);
    
    // Check if we should skip thrusters for pods
    let actualNextStepId = nextStepId;
    if (nextStepId === 'thrusters' && answers.propulsion_type === 'pods') {
      actualNextStepId = 'batteries';
    }
    
    if (actualNextStepId && actualNextStepId !== 'complete') {
      const nextStep = getSetupStep(actualNextStepId);
      if (nextStep) {
        setTimeout(() => {
          setChatMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: 'bot',
              content: nextStep.question,
              options: nextStep.options,
              stepId: nextStep.id,
            },
          ]);
          setCurrentStepId(actualNextStepId!);
        }, 500);
      }
    } else {
      // Setup complete
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: 'bot',
            content: "Great! I've got everything I need. Ready to create your components? 🎉",
          },
        ]);
        setCurrentStepId('complete');
      }, 500);
    }
  };
  
  const handleSkip = (stepId: string) => {
    const nextStepId = getNextStep(stepId, 'skip');
    const step = getSetupStep(stepId);
    
    // Add skip message
    setChatMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'user',
        content: step?.skipLabel || "I'll add this later",
      },
    ]);
    
    if (nextStepId && nextStepId !== 'complete') {
      const nextStep = getSetupStep(nextStepId);
      if (nextStep) {
        setTimeout(() => {
          setChatMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: 'bot',
              content: "No problem! " + nextStep.question,
              options: nextStep.options,
              stepId: nextStep.id,
            },
          ]);
          setCurrentStepId(nextStepId);
        }, 500);
      }
    } else {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: 'bot',
            content: "That's all the questions! Ready to create your components?",
          },
        ]);
        setCurrentStepId('complete');
      }, 500);
    }
  };
  
  const handleFormAnswer = (stepId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [stepId]: value }));
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate components from answers
      const componentDrafts = generateComponentsFromAnswers(answers);
      
      if (componentDrafts.length === 0) {
        // User skipped everything - that's okay!
        onComplete();
        onClose();
        return;
      }
      
      // Format for API
      const components = componentDrafts.map((draft, index) => ({
        category: draft.category || 'propulsion',
        type: draft.type,
        name: draft.name,
        position: draft.positionOptions?.[0] || null,
        sort_order: index,
      }));
      
      const response = await fetch(`/api/boats/${boatId}/components`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save components');
      }
      
      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  // Count components that will be created
  const previewComponents = generateComponentsFromAnswers(answers);
  
  // MODE SELECT SCREEN
  if (mode === 'select') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Set up {boatName}
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              How would you like to set up your boat's components?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => setMode('chat')}
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Guide Me</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Step-by-step questions
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                </div>
              </button>
              
              <button
                onClick={() => setMode('form')}
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <List className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Quick Setup</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      All options at once
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
                </div>
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                I'll do this later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // CHAT MODE
  if (mode === 'chat') {
    const currentStep = getSetupStep(currentStepId);
    const lastBotMessage = chatMessages.filter(m => m.type === 'bot' && m.options).slice(-1)[0];
    
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Setting up {boatName}
                </h2>
                <button
                  onClick={() => setMode('form')}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Switch to form →
                </button>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
            
            {/* Options / Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {currentStepId === 'complete' ? (
                <div className="space-y-3">
                  {previewComponents.length > 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 max-h-24 overflow-y-auto">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Creating {previewComponents.length} components:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {previewComponents.map((comp, i) => (
                          <span 
                            key={i} 
                            className="text-xs bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                          >
                            {comp.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      No components to create — you can add them manually later
                    </div>
                  )}
                  <Button
                    onClick={handleSubmit}
                    loading={loading}
                    className="w-full justify-center"
                    size="lg"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {previewComponents.length > 0 ? 'Create Components' : 'Done'}
                  </Button>
                </div>
              ) : lastBotMessage?.options ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {lastBotMessage.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleChatAnswer(lastBotMessage.stepId!, option.value, option.label)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-900 dark:text-white rounded-full text-sm transition-colors"
                      >
                        {option.icon && <span className="mr-1">{option.icon}</span>}
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {currentStep?.skippable && (
                    <button
                      onClick={() => handleSkip(lastBotMessage.stepId!)}
                      className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2"
                    >
                      <SkipForward className="w-4 h-4 inline mr-1" />
                      {currentStep.skipLabel || "Skip"}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // FORM MODE
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Quick Setup
              </h2>
              <button
                onClick={() => setMode('chat')}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Switch to guided →
              </button>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-6">
            {/* Propulsion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Propulsion Type
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'inboard', label: 'Inboard' },
                  { value: 'outboard', label: 'Outboard' },
                  { value: 'pods', label: 'Pods' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFormAnswer('propulsion_type', opt.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      answers.propulsion_type === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Engine Count */}
            {answers.propulsion_type && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of {answers.propulsion_type === 'pods' ? 'Pods' : 'Engines'}
                </label>
                <div className="flex gap-2">
                  {(answers.propulsion_type === 'outboard' ? ['1', '2', '3', '4'] : ['1', '2', '3']).map((num) => (
                    <button
                      key={num}
                      onClick={() => handleFormAnswer(
                        answers.propulsion_type === 'pods' ? 'pod_count' : 
                        answers.propulsion_type === 'outboard' ? 'outboard_count' : 'inboard_count',
                        num
                      )}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        (answers.pod_count === num || answers.outboard_count === num || answers.inboard_count === num)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Generator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Generator(s)
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'none', label: 'None' },
                  { value: '1', label: 'One' },
                  { value: '2', label: 'Two' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFormAnswer('generator', opt.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      answers.generator === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Thrusters (not for pods) */}
            {answers.propulsion_type !== 'pods' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thrusters
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'none', label: 'None' },
                    { value: 'bow', label: 'Bow' },
                    { value: 'stern', label: 'Stern' },
                    { value: 'both', label: 'Both' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleFormAnswer('thrusters', opt.value)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        answers.thrusters === opt.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Batteries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Battery Voltage
              </label>
              <div className="flex gap-2">
                {[
                  { value: '12v', label: '12V' },
                  { value: '24v', label: '24V' },
                  { value: 'mixed', label: 'Mixed' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFormAnswer('batteries', opt.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      answers.batteries === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* HVAC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Air Conditioning
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'none', label: 'None' },
                  { value: 'chiller', label: 'Chiller' },
                  { value: 'split', label: 'Split' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFormAnswer('hvac', opt.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      answers.hvac === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tender / PWC
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'none', label: 'None' },
                  { value: 'outboard', label: 'Tender' },
                  { value: 'jet', label: 'Jet Ski' },
                  { value: 'both', label: 'Both' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFormAnswer('tender', opt.value)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      answers.tender === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hydraulics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hydraulic Systems
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'none', label: 'None' },
                  { value: 'platform', label: 'Swim Platform' },
                  { value: 'crane', label: 'Tender Crane' },
                  { value: 'passerelle', label: 'Passerelle' },
                  { value: 'multiple', label: 'Multiple' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFormAnswer('hydraulics', opt.value)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      answers.hydraulics === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Preview & Submit */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            {previewComponents.length > 0 ? (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Will create {previewComponents.length} components:
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {previewComponents.map((comp, i) => (
                      <span 
                        key={i} 
                        className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {comp.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select options above or skip to add components later
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                loading={loading}
                className="flex-1"
              >
                {previewComponents.length > 0 ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Create Components
                  </>
                ) : (
                  'Skip for Now'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
