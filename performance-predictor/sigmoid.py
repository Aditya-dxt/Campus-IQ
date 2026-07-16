import numpy as np

def sigmoid(z):
    exp_z=np.exp(-z)
    result = (1/(1+exp_z))
    return result

if __name__ == "__main__":
   print(sigmoid(0))
   print(sigmoid(-8))
   print(sigmoid(8))