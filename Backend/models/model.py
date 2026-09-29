import torch
import torch.nn as nn

class SurgePredictorMLP(nn.Module):
    def __init__(self, input_dim):
        super(SurgePredictorMLP, self).__init__()
        
        self.network = nn.Sequential(
            # Hidden Layer 1
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.2), # Drops 20% of neurons randomly to prevent overfitting
            
            # Hidden Layer 2
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            
            # Output Layer (1 neuron for Regression, no activation function)
            nn.Linear(32, 1)
        )

    def forward(self, x):
        return self.network(x)