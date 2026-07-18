import numpy as np 

def average_log_loss(y,y_hat):
    average_loss=np.mean(-((y*np.log(y_hat))+((1-y)*(np.log(1-y_hat)))))

    return average_loss

