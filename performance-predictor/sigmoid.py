import numpy as np

def sigmoid(z):
    exp_z=np.exp(-z)
    result = (1/(1+exp_z))
    return result
