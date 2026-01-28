import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { MindMapNodeType } from '../../types';

interface CustomNodeProps {
    data: {
        label: string;
        description?: string;
        icon?: string;
        color?: string;
        nodeType: MindMapNodeType;
    };
}

export const CustomNode = memo(({ data }: CustomNodeProps) => {
    const { label, description, icon, color, nodeType } = data;

    // Define styles based on node type
    const getNodeStyles = () => {
        switch (nodeType) {
            case 'central':
                return {
                    width: '280px',
                    padding: '24px',
                    fontSize: '18px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                };
            case 'main':
                return {
                    width: '220px',
                    padding: '18px',
                    fontSize: '15px',
                    fontWeight: '600',
                    background: color || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                };
            case 'action':
                return {
                    width: '200px',
                    padding: '14px',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
                };
            case 'insight':
                return {
                    width: '200px',
                    padding: '14px',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(67, 233, 123, 0.3)',
                };
            case 'sub':
            default:
                return {
                    width: '180px',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: '400',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--color-text-primary)',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                };
        }
    };

    const nodeStyles = getNodeStyles();
    const isLightNode = nodeType === 'sub';

    return (
        <div
            style={{
                ...nodeStyles,
                borderRadius: '16px',
                position: 'relative',
                transition: 'all 0.3s ease',
            }}
            className="custom-node"
        >
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    background: isLightNode ? '#667eea' : 'white',
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                }}
            />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {icon && (
                    <div style={{ fontSize: '20px', flexShrink: 0 }}>
                        {icon}
                    </div>
                )}
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: description ? '6px' : '0' }}>
                        {label}
                    </div>
                    {description && (
                        <div
                            style={{
                                fontSize: '12px',
                                opacity: 0.9,
                                lineHeight: '1.4',
                                textAlign: 'left',
                            }}
                        >
                            {description.includes('•') || description.includes('\n') ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {description.split(/\n|•/).map((line, i) => {
                                        const cleanLine = line.trim();
                                        if (!cleanLine) return null;
                                        return (
                                            <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                                                <span style={{ opacity: 0.6 }}>•</span>
                                                <span>{cleanLine}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                description
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: isLightNode ? '#667eea' : 'white',
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                }}
            />
        </div>
    );
});

CustomNode.displayName = 'CustomNode';
